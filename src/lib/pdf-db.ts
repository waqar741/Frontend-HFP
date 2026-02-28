/**
 * pdf-db.ts
 * IndexedDB wrapper for local PDF blob and chunk storage.
 * Stores raw PDF bytes and extracted text chunks entirely in the browser —
 * no server required until the real /api/documents backend is ready.
 *
 * DB name: hfp-pdf-library   version: 1
 * Stores:
 *   - "blobs"  : { id: string (docId), blob: Blob }
 *   - "chunks" : { id: string (docId), chunks: DocumentChunk[] }
 */

import type { DocumentChunk } from '@/types/document';

const DB_NAME = 'hfp-pdf-library';
const DB_VERSION = 1;

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

    /** Get chunks for multiple doc IDs, concatenated up to a token budget (approx words) */
    async getContextForIds(docIds: string[], wordBudget = 2500): Promise<string> {
        const parts: string[] = [];
        let wordCount = 0;
        for (const id of docIds) {
            const chunks = await PdfDB.getChunks(id);
            for (const chunk of chunks) {
                const words = chunk.text.split(/\s+/).length;
                if (wordCount + words > wordBudget) break;
                parts.push(chunk.text);
                wordCount += words;
            }
        }
        return parts.join('\n\n');
    },
};
