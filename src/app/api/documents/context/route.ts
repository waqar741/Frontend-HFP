import { NextResponse } from 'next/server';

/**
 * Stub context route for /api/documents/context
 * Called by ChatInput before sending a message when @mentions are detected.
 * Real implementation will fetch stored chunks and concatenate them within a token budget.
 */

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    if (!ids) return NextResponse.json({ context: '' });

    // TODO: load chunks from data/chunks/{id}.json for each id and concatenate
    return NextResponse.json({ context: '' });
}
