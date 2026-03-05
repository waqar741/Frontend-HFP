export interface DocumentRecord {
    id: string;            // UUID
    name: string;          // slugified @tag name (e.g. "blood-test-2024")
    originalName: string;  // original filename "Blood Test 2024.pdf"
    hash: string;          // SHA-256 of file bytes — deduplication key
    size: number;          // bytes
    pageCount: number;
    uploadedAt: number;    // unix timestamp ms
    chunkCount: number;
    processingStatus: 'pending' | 'ready' | 'error';
    errorMessage?: string;
    hasImages?: boolean;   // true if PDF contains rendered page images
    imageCount?: number;   // number of page images extracted
}

export interface DocumentChunk {
    docId: string;
    index: number;
    text: string;
    pageNumber?: number;
}

/** A rendered PDF page image (JPEG base64) */
export interface PageImage {
    docId: string;
    pageNumber: number;
    dataUrl: string;       // data:image/jpeg;base64,...
    width: number;
    height: number;
}
