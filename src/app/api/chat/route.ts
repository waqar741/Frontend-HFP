import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Transparent streaming proxy for llama.cpp Chat Completions API.
 * The client sends a fully-formed OpenAI Chat Completions request body,
 * and this handler proxies it to the backend while properly streaming SSE.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const baseUrl = process.env.HFP_API_BASE_URL || 'http://localhost:8080';

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Forward X-Target-Node header if present
        const targetNode = req.headers.get('X-Target-Node');
        if (targetNode) {
            headers['X-Target-Node'] = targetNode;
        }

        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Upstream API error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: `Upstream error: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        // Stream the SSE response directly to the client without buffering
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error in chat proxy:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
