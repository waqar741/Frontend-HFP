# Universal PDF Knowledge Library

A production-grade, **offline-first** system allowing users to upload PDFs once, store them in a universal browser-local library, and reference them in chat via `@document_name` mentions. Designed for absolute privacy, zero server processing costs, and instant retrieval.

## Architecture: Offline-First

Unlike traditional server-heavy RAG (Retrieval-Augmented Generation) pipelines, this feature runs entirely within the user's browser. 

1. **User Uploads PDF** -> Drag & drop into the Document Library panel.
2. **Local Hash Check** -> Computes SHA-256 of the file bytes.
   - **Yes (Duplicate):** Returns existing document metadata instantly. 
   - **No (New):** Extracts text locally using `pdfjs-dist`. Chunks text into segments.
3. **Local Storage** -> Saves raw PDF blobs and text chunks into **IndexedDB**. Saves metadata (name, hash, size) into **localStorage** (via Zustand `persist`).
4. **Chat Mentioning** -> User types `@` in chat. Autocomplete dropdown filters local documents.
5. **Context Injection** -> When sending a message with an `@mention`, the chat frontend fetches chunks directly from IndexedDB and silently injects them as system context ahead of the LLM call.

## The Tech Stack

Two lightweight, zero-dependency local stores that fit a privacy-first Next.js setup:

| Data Type | Delivery Mechanism |
|---|---|
| **Document Metadata** | `localStorage` (via Zustand `persist` middleware) |
| **PDF Text Chunks** | `IndexedDB` (via `idb` wrapper in `src/lib/pdf-db.ts`) |
| **Raw PDF Blobs** | `IndexedDB` |
| **Text Extraction** | `pdfjs-dist` (Browser-native PDF parsing, ServiceWorker based) |

> **Note on Scaling:** Because the processing logic (hashing, extraction, chunking) is completely decoupled into `src/lib/pdf-extractor.ts`, it is trivial to add a `syncToApi()` method later to push these pre-processed, pre-chunked documents to a backend (like Vercel Blob + Postgres) once user authentication is introduced.

## Deduplication Strategy (Zero Reprocessing)

Before processing any uploaded PDF:
1. Compute **SHA-256 hash** of the raw file bytes using the native `crypto.subtle` browser API.
2. Query the Zustand document store for a matching hash.
3. If found -> return the existing `DocumentRecord` immediately (skip all processing).
4. If not found -> proceed with text extraction and IndexedDB storage.

This means if a user uploads the same 50-page lab report twice, the second upload takes 10 milliseconds and uses zero extra storage.

## Text Extraction & Chunking

**Library:** `pdfjs-dist` (Standard Mozilla PDF.js compiled for modern browsers)

**Chunking strategy:**
- Split extracted text into logical blocks using token approximations.
- Enforces an overlap between chunks (e.g., 50 words) so context isn't lost across chunk boundaries.
- Generates a friendly `@slug` based on the original filename for easy typing.

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
