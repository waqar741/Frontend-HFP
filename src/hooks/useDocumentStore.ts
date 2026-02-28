'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentRecord } from '@/types/document';

/**
 * useDocumentStore
 *
 * Offline-first PDF knowledge store.
 *
 * Storage layers:
 *  ┌─────────────────────────────────────────────────────────┐
 *  │ Layer 1 – Zustand + localStorage                       │
 *  │   DocumentRecord[] metadata (name, hash, status, …)   │
 *  ├─────────────────────────────────────────────────────────┤
 *  │ Layer 2 – IndexedDB (via pdf-db.ts)                    │
 *  │   Raw PDF Blob  +  DocumentChunk[]                     │
 *  ├─────────────────────────────────────────────────────────┤
 *  │ Layer 3 – /api/documents  (future, opt-in)             │
 *  │   Real server processing when backend is ready         │
 *  └─────────────────────────────────────────────────────────┘
 *
 * All extraction runs client-side via pdfjs-dist.
 * SHA-256 deduplication prevents reprocessing the same PDF.
 */

interface DocumentStore {
    documents: DocumentRecord[];
    isUploading: boolean;
    uploadProgress: number; // 0–100
    processingDocId: string | null;

    loadDocuments: () => void;            // reads from persisted state (instant)
    uploadDocument: (file: File) => Promise<DocumentRecord | null>;
    deleteDocument: (id: string) => Promise<void>;
    getDocumentByName: (name: string) => DocumentRecord | undefined;
    getContextForMentions: (text: string) => Promise<string>;
    syncToApi: () => Promise<void>;       // future: push local docs to real API
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
                // Optionally verify IndexedDB blobs still exist.
            },

            uploadDocument: async (file: File) => {
                if (file.type !== 'application/pdf') return null;

                set({ isUploading: true, uploadProgress: 5 });

                try {
                    // 1. Read bytes
                    const buffer = await file.arrayBuffer();
                    set({ uploadProgress: 15 });

                    // 2. SHA-256 deduplication — avoid reprocessing
                    const { sha256, slugify, extractPdfText, chunkText } = await import('@/lib/pdf-extractor');
                    const hash = await sha256(buffer);
                    set({ uploadProgress: 25 });

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
                        uploadProgress: 35,
                    }));

                    // 4. Save raw blob to IndexedDB
                    const { PdfDB } = await import('@/lib/pdf-db');
                    await PdfDB.saveBlob(id, new Blob([buffer], { type: 'application/pdf' }));
                    set({ uploadProgress: 50 });

                    // 5. Extract text with pdfjs-dist (client-side)
                    const { text, pageCount } = await extractPdfText(buffer);
                    set({ uploadProgress: 75 });

                    // 6. Chunk and save
                    const chunks = chunkText(id, text);
                    await PdfDB.saveChunks(id, chunks);
                    set({ uploadProgress: 90 });

                    // 7. Finalize record
                    const readyRecord: DocumentRecord = {
                        ...pendingRecord,
                        pageCount,
                        chunkCount: chunks.length,
                        processingStatus: text.trim().length > 0 ? 'ready' : 'error',
                        errorMessage: text.trim().length === 0
                            ? 'No extractable text found. This PDF may be a scanned image.'
                            : undefined,
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
                await Promise.all([PdfDB.deleteBlob(id), PdfDB.deleteChunks(id)]);
                set(state => ({ documents: state.documents.filter(d => d.id !== id) }));
            },

            getDocumentByName: (name: string) => {
                return get().documents.find(d =>
                    d.name.toLowerCase() === name.toLowerCase()
                );
            },

            /**
             * Given a message string, extract @mentions, fetch their chunks from
             * IndexedDB, and return a combined context string for LLM injection.
             */
            getContextForMentions: async (text: string) => {
                const mentions = (text.match(/@([\w-]+)/g) || []).map(m => m.slice(1));
                if (mentions.length === 0) return '';

                const { documents } = get();
                const docIds = mentions
                    .map(m => documents.find(d => d.name === m && d.processingStatus === 'ready')?.id)
                    .filter(Boolean) as string[];

                if (docIds.length === 0) return '';

                const { PdfDB } = await import('@/lib/pdf-db');
                return PdfDB.getContextForIds(docIds);
            },

            /**
             * Sync all local 'ready' documents to the real API when it becomes available.
             * Call this once the backend /api/documents/upload is properly implemented.
             */
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
                            // If server has real processing, update record with server ID
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
            // Only persist metadata — blobs/chunks live in IndexedDB
            partialize: (state) => ({ documents: state.documents }),
        }
    )
);
