import { NextResponse } from 'next/server';

/**
 * Stub upload route for /api/documents/upload
 * Returns a mock DocumentRecord so the frontend upload flow can be tested.
 * Replace with real SHA-256 hashing + pdf-parse processing in the backend phase.
 */

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 422 });
        }

        // Stub response — real implementation will hash, extract text, chunk, persist
        const mockDoc = {
            id: crypto.randomUUID(),
            name: file.name.replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            originalName: file.name,
            hash: 'stub-hash-' + Date.now(),
            size: file.size,
            pageCount: 0,
            uploadedAt: Date.now(),
            chunkCount: 0,
            processingStatus: 'error' as const,
            errorMessage: 'Backend processing not yet implemented. Connect a real pdf-parse handler.',
        };

        return NextResponse.json({ document: mockDoc });
    } catch (err) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
