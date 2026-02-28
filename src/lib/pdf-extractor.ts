/**
 * pdf-extractor.ts
 * Client-side PDF text extraction using pdfjs-dist.
 * Runs entirely in the browser — no server required.
 *
 * Also provides:
 *   - SHA-256 hashing for deduplication
 *   - Text chunking (500 words / 50 word overlap)
 *   - Slug generation for @mention names
 */

import type { DocumentChunk } from '@/types/document';

/** Compute SHA-256 hex of an ArrayBuffer (uses Web Crypto API) */
export async function sha256(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/** Slugify a filename into a valid @mention name */
export function slugify(filename: string): string {
    return filename
        .replace(/\.pdf$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}

/** Split text into chunks of ~500 words with 50-word overlap */
export function chunkText(docId: string, text: string): DocumentChunk[] {
    const words = text.split(/\s+/).filter(Boolean);
    const CHUNK_SIZE = 500;
    const OVERLAP = 50;
    const chunks: DocumentChunk[] = [];

    let start = 0;
    while (start < words.length) {
        const end = Math.min(start + CHUNK_SIZE, words.length);
        chunks.push({
            docId,
            index: chunks.length,
            text: words.slice(start, end).join(' '),
        });
        if (end === words.length) break;
        start = end - OVERLAP;
    }
    return chunks;
}

/** Extract full text and page count from a PDF ArrayBuffer using pdf.js */
export async function extractPdfText(buffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
    // Dynamically import pdfjs-dist (avoids SSR issues in Next.js)
    const pdfjs = await import('pdfjs-dist');

    // Set the worker (bundled)
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).toString();
    }

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= Math.min(pageCount, 200); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');
        if (pageText.trim()) textParts.push(pageText);
    }

    return { text: textParts.join('\n'), pageCount };
}
