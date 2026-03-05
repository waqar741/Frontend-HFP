# Universal PDF Knowledge Library

A production-grade, **offline-first** system allowing users to upload PDFs once, store them in a universal browser-local library, and reference them in chat via `@document_name` mentions. Designed for absolute privacy, zero server processing costs, and instant retrieval.

## Architecture: Offline-First

Unlike traditional server-heavy RAG (Retrieval-Augmented Generation) pipelines, this feature runs entirely within the user's browser. 

1. **User Uploads PDF** -> Drag & drop into the Document Library panel.
2. **Dual-Flow Processing**: 
   - **API Upload (Parallel)**: Raw PDF is sent asynchronously to `/api/upload` for server-side persistence.
   - **Local Text Extraction**: Extracts text locally using `pdfjs-dist`. Chunks text into segments.
   - **Local Image Extraction**: If the PDF is scanned or image-based (< 50 chars per page), `pdfjs-dist` Canvas API renders pages into base64 JPEGs.
3. **Local Storage** -> Saves raw PDF blobs, text chunks, and images into **IndexedDB**. Saves metadata (name, hash, size, image flag) into **localStorage**.
4. **Chat Mentioning** -> User types `@` in chat. Autocomplete dropdown filters local documents.
5. **Context Injection** -> When sending a message with an `@mention`, the chart frontend fetches chunks and images from IndexedDB. Text chunks are dynamically **compressed** (stopwords removed, whitespace optimized) and **relevance-scored** against the user's query to minimize token usage.
6. **Multimodal Payload** -> Injects the compressed text as system context. If the document has images, constructs an OpenAI-compatible multimodal array (`image_url`) for vision models.

## The Tech Stack

Two lightweight, zero-dependency local stores that fit a privacy-first Next.js setup:

| Data Type | Delivery Mechanism |
|---|---|
| **Document Metadata** | `localStorage` (via Zustand `persist` middleware) |
| **PDF Text Chunks** | `IndexedDB` (via `idb` wrapper in `src/lib/pdf-db.ts`) |
| **PDF Page Images** | `IndexedDB` (Stores base64 rendered pages for scanned PDFs) |
| **Raw PDF Blobs** | `IndexedDB` |
| **Text/Image Extraction** | `pdfjs-dist` (Browser-native PDF parsing with Canvas API) |

> **Note on Scaling:** Because the processing logic (hashing, extraction, chunking) is completely decoupled into `src/lib/pdf-extractor.ts`, it is trivial to add a `syncToApi()` method later to push these pre-processed, pre-chunked documents to a backend (like Vercel Blob + Postgres) once user authentication is introduced.

## Deduplication Strategy (Zero Reprocessing)

Before processing any uploaded PDF:
1. Compute **SHA-256 hash** of the raw file bytes using the native `crypto.subtle` browser API.
2. Query the Zustand document store for a matching hash.
3. If found -> return the existing `DocumentRecord` immediately (skip all processing).
4. If not found -> proceed with text extraction and IndexedDB storage.

This means if a user uploads the same 50-page lab report twice, the second upload takes 10 milliseconds and uses zero extra storage.

## Text & Image Extraction

**Library:** `pdfjs-dist` (Standard Mozilla PDF.js compiled for modern browsers)

**Extraction Strategy:**
- Text is extracted per page. If a PDF is deemed "image-heavy" (averaging < 50 characters per page), the system automatically triggers image extraction.
- **Canvas Rendering**: Pages are drawn to an `OffscreenCanvas` and exported as JPEG data URLs.

**Chunking & Preprocessing (`src/lib/text-preprocessor.ts`):**
- Split extracted text into logical blocks using token approximations.
- **Context Window Optimization**: Before sending to the LLM, the text is heavily compressed:
  - **Medical-Aware Stopword Removal**: Removes common words (`the`, `and`) but preserves critical clinical terms (`no`, `not`, `absent`, `left`).
  - **Boilerplate Stripping**: Removes recurring headers, footers, pagination, and timestamps to save tokens.
  - **Relevance Scoring**: Chunks are scored via keyword-overlap against the user's specific query, injecting only the most highly relevant segments first to save context window.

## Zustand Library Store (`src/hooks/useDocumentStore.ts`)

```typescript
interface DocumentStore {
  documents: DocumentRecord[];       // Persisted to localStorage
  isLoading: boolean;
  uploadProgress: number;
  
  loadDocuments: () => Promise<void>; // Hydrates state
  uploadDocument: (file: File) => Promise<DocumentRecord | null>;
  deleteDocument: (id: string) => Promise<void>;
  getContextForMentions: (docIds: string[]) => Promise<string>;
}
```

## @Mention UX Flow

1. Keystroke `@` triggers the autocomplete popover above the chat input.
2. User types to filter the list of uploaded documents. Arrow keys / click to select.
3. The selected document becomes an atomic blue token in the input field: `@BloodTest2024`.
4. On submit, the system extracts the document IDs from the tokens, pulls the text chunks from IndexedDB via `getContextForMentions()`, and prepends them as a hidden system prompt before sending the user's query to the AI.
