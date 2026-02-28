# Universal PDF Knowledge Library - Implementation Plan

A production-grade system allowing users to upload PDFs once, store them in a universal library, and reference them in chat via `@document_name` mentions. Designed to avoid reprocessing and to minimize server load.

## Background & Context

The current codebase is a **Next.js** medical AI chat app. Messages go to local/remote AI nodes via `/api/chat`. There is an existing `/api/upload` route and a `file-service.ts`. Chat state lives in a Zustand store persisted to localStorage.

The PDF library is a **cross-session, global resource** — not tied to any single chat session.

## Architecture Overview

1. **User Uploads PDF** -> `/api/documents/upload`
2. **Hash Check** -> Is SHA-256 hash already present?
   - **Yes:** Return existing doc metadata. 
   - **No:** Store raw PDF. Extract text via `pdf-parse`. Chunk text into segments. Store chunks to filesystem (`data/chunks/`). Update `data/documents.json`. Return metadata. 
3. **Frontend Updates** -> The Library Store shows the new file.
4. **Chat Mentioning** -> User types `@doc` in chat. Autocomplete resolver matches document IDs.
5. **Context Injection** -> Chat frontend fetches chunks via `/api/documents/context?id=...` and injects them as system context ahead of the LLM call.

## Data Model (src/types/document.ts)

```typescript
export interface DocumentRecord {
  id: string;            // UUID
  name: string;          // Friendly @tag name (slugified filename)
  originalName: string;  // "Blood_Test_Results.pdf"
  hash: string;          // SHA-256 of file bytes — deduplication key
  size: number;          // bytes
  pageCount: number;
  uploadedAt: number;    // timestamp
  chunkCount: number;
  storagePath: string;   // e.g. "/uploads/abc123.pdf"
  processingStatus: 'pending' | 'ready' | 'error';
}

export interface DocumentChunk {
  docId: string;
  index: number;
  text: string;
  pageNumber?: number;
}
```

## Storage Strategy

Two lightweight, zero-dependency stores that fit the current Next.js setup (no external DB required initially):

| Store | Purpose | Implementation |
|---|---|---|
| **Document Registry** | `DocumentRecord[]` metadata | `data/documents.json` (persisted JSON file, read/written via API routes) |
| **Chunks Store** | Full text chunks per document | `data/chunks/` directory, one file per doc: `{docId}.json` |
| **Raw PDFs** | Original binary | `public/uploads/{hash}.pdf` |

> **Note:** For Vercel/serverless deployments, swap to **Vercel Blob** (raw PDFs) + **Vercel KV** or **PlanetScale** (metadata + chunks).

## Deduplication Strategy (Avoid Reprocessing)

Before processing any uploaded PDF:
1. Compute **SHA-256 hash** of the raw file bytes on the server.
2. Query the document registry for a matching hash.
3. If found -> return the existing `DocumentRecord` immediately (skip all processing).
4. If not found -> proceed with text extraction and chunking.

This is the **most important optimization**. The same lab report uploaded twice costs zero extra processing.

## Backend API Routes

### 1. `src/app/api/documents/upload/route.ts`
- **Method**: POST `multipart/form-data` with a single PDF
- **Steps**: receive -> hash -> deduplicate check -> extract text (`pdf-parse`) -> chunk -> store -> return `DocumentRecord`
- **Returns**: `{ document: DocumentRecord }`

### 2. `src/app/api/documents/route.ts`
- **Method**: GET -> returns all `DocumentRecord[]` (the library)
- **Method**: DELETE `?id=...` -> removes a document and its chunks

### 3. `src/app/api/documents/context/route.ts`
- **Method**: GET `?ids=id1,id2` -> returns relevant chunks for the given document IDs 
- **Usage**: Used just before sending a chat message. Concatenates chunk text up to a configurable token budget.

## Text Extraction & Chunking

**Library:** `pdf-parse` (lightweight, no native binaries)

**Chunking strategy:**
- Split extracted text into chunks of ~500 words each with 50-word overlap
- Store `pageNumber` if the PDF parser provides it
- Cap total chunks at 100 per document (truncate very large PDFs with a warning)

## Zustand Library Store (src/hooks/useDocumentStore.ts)

```typescript
interface DocumentStore {
  documents: DocumentRecord[];
  isLoading: boolean;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<DocumentRecord>;
  deleteDocument: (id: string) => Promise<void>;
}
```
*Not persisted to localStorage — always fetched fresh from the API on mount.*

## Frontend Components

- **DocumentLibrary Panel:** A slide-out panel or Settings tab showing all uploaded documents, upload zone (drag-and-drop), status indicators, and delete buttons.
- **DocumentUploadButton:** Standalone upload trigger (toolbar or sidebar), no prompt required.
- **ChatInput changes:** Detect `@` character, show autocomplete dropdown, insert `@document_name`. 
- **api-client changes:** `sendChatMessage()` gains an optional `documentIds?: string[]` parameter. Preprends fetched chunks as a special system message block.

## @Mention UX Flow

1. `@` keystroke triggers a dropdown above the input showing matching document names.
2. Arrow keys / click to select — inserts `@BloodTest2024` as a token.
3. On send: the input parser extracts all `@mentions`, resolves them to `documentId` via the library.
4. The resolved IDs are passed to the API client to fetch the chunks as context injection.

## Indexing & Retrieval

For the initial implementation, use **positional retrieval** (inject first N chunks). This is fast and zero-infrastructure.

For a production upgrade, add **semantic search** using an embedding model and vector search.

| Optimization | Implementation |
|---|---|
| **Hash deduplication** | SHA-256 check on upload, skip reprocessing |
| **Chunk cache** | In-memory LRU cache of recently accessed chunk files |
| **Lazy chunk loading** | Only load chunks for `@mentioned` docs |
| **Token budget** | Cap context injection at 2500 tokens |
