/**
 * pdf-extractor.ts
 * Client-side PDF text AND image extraction using pdfjs-dist.
 * Runs entirely in the browser — no server required.
 *
 * Also provides:
 *   - SHA-256 hashing for deduplication
 *   - Text chunking (500 words / 50 word overlap)
 *   - Slug generation for @mention names
 *   - Page image rendering (for scanned / image-heavy PDFs)
 */

import type { DocumentChunk, PageImage } from '@/types/document';

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
    const pdfjs = await import('pdfjs-dist');

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

/**
 * Render PDF pages as JPEG images (for scanned / image-heavy PDFs).
 * Uses OffscreenCanvas when available, falls back to regular canvas.
 * Limits to first 20 pages and scales to max 1200px width for efficiency.
 */
export async function extractPdfImages(
    buffer: ArrayBuffer,
    maxPages = 20,
    scale = 1.5
): Promise<PageImage[]> {
    const pdfjs = await import('pdfjs-dist');

    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).toString();
    }

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const pageCount = Math.min(pdf.numPages, maxPages);
    const images: PageImage[] = [];

    for (let i = 1; i <= pageCount; i++) {
        try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });

            // Use a regular canvas element (OffscreenCanvas render API not fully supported everywhere)
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            images.push({
                docId: '', // Will be set by caller
                pageNumber: i,
                dataUrl,
                width: viewport.width,
                height: viewport.height,
            });
        } catch (err) {
            console.warn(`Failed to render page ${i} as image:`, err);
        }
    }

    return images;
}

/**
 * Combined extraction: text + images.
 * Always extracts text. If text is minimal (< 50 chars per page),
 * also renders pages as images for multimodal model support.
 */
export async function extractPdfContent(buffer: ArrayBuffer): Promise<{
    text: string;
    pageCount: number;
    images: PageImage[];
    isImageBased: boolean;
}> {
    const { text, pageCount } = await extractPdfText(buffer);

    // Determine if this is a scanned/image-based PDF
    const avgCharsPerPage = text.length / Math.max(pageCount, 1);
    const isImageBased = avgCharsPerPage < 50;

    let images: PageImage[] = [];
    if (isImageBased && pageCount > 0) {
        // Extract page images for scanned PDFs
        images = await extractPdfImages(buffer, Math.min(pageCount, 20));
    }

    return { text, pageCount, images, isImageBased };
}
