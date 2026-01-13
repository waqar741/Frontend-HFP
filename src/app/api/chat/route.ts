import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, targetNode, model } = await req.json();

        const baseUrl = process.env.HFP_API_BASE_URL;
        const apiKey = process.env.HFP_API_KEY;

        if (!baseUrl || !apiKey) {
            console.error('Missing API configuration');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-Target-Node': targetNode || 'default-node', // Fallback or strict requirement
            },
            body: JSON.stringify({
                model: model || 'Qwen2.5-1.5B-Instruct', // Default model if not provided
                messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Upstream API error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: `Upstream error: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        // Proxy the stream directly to the client
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
