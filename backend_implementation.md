# Backend Integration Plan for PDF Knowledge Base

The current PDF Knowledge Base is entirely offline-first (using IndexedDB and `pdfjs-dist`). This document outlines what needs to be implemented on the backend and frontend to safely scale this to a cloud-based multi-user system.

---

## 1. What Remains on the Frontend

Right now, the frontend handles extraction entirely in the browser, but we have implemented a **Dual-Flow** setup where the file is also sent to `/api/upload`. To fully move to a backend-only RAG system:

- [x] **Update `useDocumentStore.ts`**: We now upload the raw blob to `POST /api/upload` in parallel with local extraction.
- [ ] **Update Chat Submission**: Currently, `getContextForMentions()` pulls text chunks and images directly from IndexedDB. It should instead just append the `{documentIds}` to the payload sent to `/api/chat`.
- [ ] **Delete IndexedDB Code**: Once fully backend-reliant, the local `pdf-db.ts`, `text-preprocessor.ts`, and `pdf-extractor.ts` can be removed to reduce client bundle size.

## 2. Backend Implementation Steps

To achieve a production-ready RAG (Retrieval-Augmented Generation) pipeline:

### A. Storage Architecture
1. **Blob Storage (AWS S3, Vercel Blob)**: Store the raw uploaded `.pdf` files.
2. **Vector Database (Pinecone, Postgres pgvector)**: Store the extracted text chunks alongside their OpenAI embeddings to allow for semantic search.
3. **Relational Database (Postgres)**: Store document metadata (`DocumentRecord` with `userId`).

### B. New API Routes Needed

**`POST /api/documents/upload`**
- Intercept multipart form-data.
- Verify user authentication (`userId`).
- Prevent re-extraction: `SELECT id FROM documents WHERE hash=$1`. If exists, map to current user and return.
- If new: Save to S3. Use a server-side extraction library (like `pdf-parse` or LangChain doc loaders).
- Chunk text and generate embeddings via OpenAI `text-embedding-3-small`.
- Save chunks to Vector DB.

**`GET /api/documents`**
- Fetch all documents belonging to the authenticated `userId`.

**`DELETE /api/documents/[id]`**
- Delete the relational record. Optionally remove chunks from Vector DB.

### C. Updating the Chat Route (`/api/chat`)
- When receiving a message, check if `{ documentIds }` are included.
- If explicit document IDs are provided (exact `@mentions`): Retrieve the text chunks directly from the Database and inject them as a system prompt.
- If implicit (no `@mentions`): Convert the user's latest query into an embedding, search the Vector DB for the top `K` most relevant chunks across *all* user documents, and inject those.

## 3. Database Schema Recommendations

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255),
  hash VARCHAR(64),
  status VARCHAR(20) DEFAULT 'ready',
  created_at TIMESTAMP DEFAULT NOW()
);

-- For pgvector
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT,
  text_content TEXT,
  embedding vector(1536) -- dimension for OpenAI embeddings
);
```
