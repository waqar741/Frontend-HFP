import { NextResponse } from 'next/server';

/**
 * Stub API for document library.
 * Replace this with real PDF processing logic (pdf-parse + hashing) when implementing the backend.
 * For now it returns an empty library so the frontend renders without errors.
 */

export async function GET() {
    return NextResponse.json({ documents: [] });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    // TODO: remove from persistent store
    return NextResponse.json({ success: true });
}
