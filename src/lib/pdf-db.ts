/**
 * pdf-db.ts
 * IndexedDB wrapper for local PDF blob, chunk, and image storage.
 * Stores raw PDF bytes, extracted text chunks, and page images
 * entirely in the browser — no server required.
 *
 * DB name: hfp-pdf-library   version: 2
 * Stores:
 *   - "blobs"  : { id: string (docId), blob: Blob }
 *   - "chunks" : { id: string (docId), chunks: DocumentChunk[] }
 *   - "images" : { id: string (docId), images: PageImage[] }
 */

import type { DocumentChunk, PageImage } from '@/types/document';

const DB_NAME = 'hfp-pdf-library';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('blobs')) {
                db.createObjectStore('blobs', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('chunks')) {
                db.createObjectStore('chunks', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images', { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function tx<T>(
    db: IDBDatabase,
    store: string,
    mode: IDBTransactionMode,
    fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    return new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const req = fn(s);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export const PdfDB = {
    async saveBlob(docId: string, blob: Blob): Promise<void> {
        const db = await openDB();
        await tx(db, 'blobs', 'readwrite', (s) => s.put({ id: docId, blob }));
        db.close();
    },

    async getBlob(docId: string): Promise<Blob | null> {
        const db = await openDB();
        const row = await tx<{ id: string; blob: Blob } | undefined>(db, 'blobs', 'readonly', (s) => s.get(docId));
        db.close();
        return row?.blob ?? null;
    },

    async deleteBlob(docId: string): Promise<void> {
        const db = await openDB();
        await tx(db, 'blobs', 'readwrite', (s) => s.delete(docId));
        db.close();
    },

    async saveChunks(docId: string, chunks: DocumentChunk[]): Promise<void> {
        const db = await openDB();
        await tx(db, 'chunks', 'readwrite', (s) => s.put({ id: docId, chunks }));
        db.close();
    },

    async getChunks(docId: string): Promise<DocumentChunk[]> {
        const db = await openDB();
        const row = await tx<{ id: string; chunks: DocumentChunk[] } | undefined>(db, 'chunks', 'readonly', (s) => s.get(docId));
        db.close();
        return row?.chunks ?? [];
    },

    async deleteChunks(docId: string): Promise<void> {
        const db = await openDB();
        await tx(db, 'chunks', 'readwrite', (s) => s.delete(docId));
        db.close();
    },

    // ---- Image storage ----

    async saveImages(docId: string, images: PageImage[]): Promise<void> {
        const db = await openDB();
        await tx(db, 'images', 'readwrite', (s) => s.put({ id: docId, images }));
        db.close();
    },

    async getImages(docId: string): Promise<PageImage[]> {
        const db = await openDB();
        const row = await tx<{ id: string; images: PageImage[] } | undefined>(db, 'images', 'readonly', (s) => s.get(docId));
        db.close();
        return row?.images ?? [];
    },

    async deleteImages(docId: string): Promise<void> {
        const db = await openDB();
        await tx(db, 'images', 'readwrite', (s) => s.delete(docId));
        db.close();
    },

    /** Get text chunks for multiple doc IDs, preprocessed and relevance-ranked */
    async getContextForIds(docIds: string[], wordBudget = 2000, query?: string): Promise<string> {
        const allChunks: { text: string; index: number }[] = [];
        let globalIndex = 0;
        for (const id of docIds) {
            const chunks = await PdfDB.getChunks(id);
            for (const chunk of chunks) {
                allChunks.push({ text: chunk.text, index: globalIndex++ });
            }
        }

        if (allChunks.length === 0) return '';

        // Use optimized context builder (stopwords removed, relevance-ranked)
        if (query) {
            const { buildOptimizedContext } = await import('@/lib/text-preprocessor');
            return buildOptimizedContext(allChunks, query, wordBudget);
        }

        // Fallback: preprocess without relevance ranking
        const { preprocessForContext } = await import('@/lib/text-preprocessor');
        const parts: string[] = [];
        let wordCount = 0;
        for (const chunk of allChunks) {
            const processed = preprocessForContext(chunk.text);
            const words = processed.split(/\s+/).length;
            if (wordCount + words > wordBudget && parts.length > 0) break;
            parts.push(processed);
            wordCount += words;
        }
        return parts.join('\n\n');
    },

    /** Get page images for multiple doc IDs, limited to maxImages total */
    async getImagesForIds(docIds: string[], maxImages = 5): Promise<PageImage[]> {
        const allImages: PageImage[] = [];
        for (const id of docIds) {
            const images = await PdfDB.getImages(id);
            for (const img of images) {
                if (allImages.length >= maxImages) break;
                allImages.push(img);
            }
            if (allImages.length >= maxImages) break;
        }
        return allImages;
    },
};
