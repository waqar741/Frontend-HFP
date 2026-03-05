'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentRecord, PageImage } from '@/types/document';

/**
 * useDocumentStore
 *
 * Offline-first PDF knowledge store with image support.
 *
 * Storage layers:
 *  ┌─────────────────────────────────────────────────────────┐
 *  │ Layer 1 – Zustand + localStorage                       │
 *  │   DocumentRecord[] metadata (name, hash, status, …)   │
 *  ├─────────────────────────────────────────────────────────┤
 *  │ Layer 2 – IndexedDB (via pdf-db.ts)                    │
 *  │   Raw PDF Blob  +  DocumentChunk[]  +  PageImage[]     │
 *  ├─────────────────────────────────────────────────────────┤
 *  │ Layer 3 – /api/upload  (sends raw PDF to backend)      │
 *  └─────────────────────────────────────────────────────────┘
 *
 * All extraction runs client-side via pdfjs-dist.
 * SHA-256 deduplication prevents reprocessing the same PDF.
 * Image-based PDFs have their pages rendered as JPEG for multimodal use.
 */

interface DocumentStore {
    documents: DocumentRecord[];
    isUploading: boolean;
    uploadProgress: number; // 0–100
    processingDocId: string | null;

    loadDocuments: () => void;
    uploadDocument: (file: File) => Promise<DocumentRecord | null>;
    deleteDocument: (id: string) => Promise<void>;
    getDocumentByName: (name: string) => DocumentRecord | undefined;
    getContextForMentions: (text: string) => Promise<{ textContext: string; images: PageImage[] }>;
    syncToApi: () => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>()(
    persist(
        (set, get) => ({
            documents: [],
            isUploading: false,
            uploadProgress: 0,
            processingDocId: null,

            loadDocuments: () => {
                // Data already rehydrated from localStorage by Zustand persist.
            },

            uploadDocument: async (file: File) => {
                if (file.type !== 'application/pdf') return null;

                set({ isUploading: true, uploadProgress: 5 });

                try {
                    // 1. Read bytes
                    const buffer = await file.arrayBuffer();
                    set({ uploadProgress: 10 });

                    // 2. SHA-256 deduplication
                    const { sha256, slugify, extractPdfContent, chunkText } = await import('@/lib/pdf-extractor');
                    const hash = await sha256(buffer);
                    set({ uploadProgress: 15 });

                    const existing = get().documents.find(d => d.hash === hash);
                    if (existing) {
                        set({ isUploading: false, uploadProgress: 0 });
                        return { ...existing, _deduplicated: true } as DocumentRecord;
                    }

                    // 3. Create pending record
                    const id = uuidv4();
                    const name = slugify(file.name);
                    const pendingRecord: DocumentRecord = {
                        id,
                        name,
                        originalName: file.name,
                        hash,
                        size: file.size,
                        pageCount: 0,
                        uploadedAt: Date.now(),
                        chunkCount: 0,
                        processingStatus: 'pending',
                    };

                    set(state => ({
                        documents: [pendingRecord, ...state.documents],
                        processingDocId: id,
                        uploadProgress: 20,
                    }));

                    // 4. Save raw blob to IndexedDB
                    const { PdfDB } = await import('@/lib/pdf-db');
                    await PdfDB.saveBlob(id, new Blob([buffer], { type: 'application/pdf' }));
                    set({ uploadProgress: 30 });

                    // 5. Upload to /api/upload in parallel (fire-and-forget)
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);
                    fetch('/api/upload', {
                        method: 'POST',
                        body: uploadFormData,
                    }).then(res => {
                        if (res.ok) {
                            console.log(`[DocStore] Uploaded "${file.name}" to /api/upload successfully`);
                        } else {
                            console.warn(`[DocStore] /api/upload failed for "${file.name}": ${res.status}`);
                        }
                    }).catch(err => {
                        console.warn(`[DocStore] /api/upload error for "${file.name}":`, err);
                    });

                    // 6. Extract text + images with pdfjs-dist (client-side)
                    set({ uploadProgress: 40 });
                    const { text, pageCount, images, isImageBased } = await extractPdfContent(buffer);
                    set({ uploadProgress: 70 });

                    // 7. Chunk text and save
                    const chunks = chunkText(id, text);
                    await PdfDB.saveChunks(id, chunks);
                    set({ uploadProgress: 80 });

                    // 8. Save page images if present
                    if (images.length > 0) {
                        const taggedImages = images.map(img => ({ ...img, docId: id }));
                        await PdfDB.saveImages(id, taggedImages);
                    }
                    set({ uploadProgress: 90 });

                    // 9. Finalize record — ready if we have text OR images
                    const hasContent = text.trim().length > 0 || images.length > 0;
                    const readyRecord: DocumentRecord = {
                        ...pendingRecord,
                        pageCount,
                        chunkCount: chunks.length,
                        hasImages: images.length > 0,
                        imageCount: images.length,
                        processingStatus: hasContent ? 'ready' : 'error',
                        errorMessage: hasContent
                            ? undefined
                            : 'No extractable text or images found in this PDF.',
                    };

                    set(state => ({
                        documents: state.documents.map(d => d.id === id ? readyRecord : d),
                        isUploading: false,
                        uploadProgress: 100,
                        processingDocId: null,
                    }));

                    setTimeout(() => set({ uploadProgress: 0 }), 600);
                    return readyRecord;

                } catch (err) {
                    console.error('PDF processing failed', err);
                    set(state => ({
                        documents: state.documents.map(d =>
                            d.id === state.processingDocId
                                ? { ...d, processingStatus: 'error', errorMessage: String(err) }
                                : d
                        ),
                        isUploading: false,
                        uploadProgress: 0,
                        processingDocId: null,
                    }));
                    return null;
                }
            },

            deleteDocument: async (id: string) => {
                const { PdfDB } = await import('@/lib/pdf-db');
                await Promise.all([
                    PdfDB.deleteBlob(id),
                    PdfDB.deleteChunks(id),
                    PdfDB.deleteImages(id),
                ]);
                set(state => ({ documents: state.documents.filter(d => d.id !== id) }));
            },

            getDocumentByName: (name: string) => {
                return get().documents.find(d =>
                    d.name.toLowerCase() === name.toLowerCase()
                );
            },

            /**
             * Given a message string, extract @mentions, fetch text chunks + images
             * from IndexedDB, and return context for LLM injection.
             */
            getContextForMentions: async (text: string) => {
                const mentions = (text.match(/@([\w-]+)/g) || []).map(m => m.slice(1));
                if (mentions.length === 0) return { textContext: '', images: [] };

                const { documents } = get();
                const matchedDocs = mentions
                    .map(m => documents.find(d => d.name === m && d.processingStatus === 'ready'))
                    .filter(Boolean) as DocumentRecord[];

                const docIds = matchedDocs.map(d => d.id);
                if (docIds.length === 0) return { textContext: '', images: [] };

                const { PdfDB } = await import('@/lib/pdf-db');
                const textContext = await PdfDB.getContextForIds(docIds, 2000, text);

                // Get images for docs that have them
                const imageDocIds = matchedDocs.filter(d => d.hasImages).map(d => d.id);
                const images = imageDocIds.length > 0
                    ? await PdfDB.getImagesForIds(imageDocIds, 5)
                    : [];

                return { textContext, images };
            },

            syncToApi: async () => {
                const { documents } = get();
                const ready = documents.filter(d => d.processingStatus === 'ready');
                const { PdfDB } = await import('@/lib/pdf-db');

                for (const doc of ready) {
                    try {
                        const blob = await PdfDB.getBlob(doc.id);
                        if (!blob) continue;

                        const formData = new FormData();
                        formData.append('file', blob, doc.originalName);

                        const res = await fetch('/api/documents/upload', {
                            method: 'POST',
                            body: formData,
                        });

                        if (res.ok) {
                            const { document: serverDoc } = await res.json();
                            console.log(`Synced "${doc.originalName}" to server as`, serverDoc.id);
                        }
                    } catch (e) {
                        console.warn(`Failed to sync "${doc.originalName}"`, e);
                    }
                }
            },
        }),
        {
            name: 'hfp-document-library',
            partialize: (state) => ({ documents: state.documents }),
        }
    )
);
