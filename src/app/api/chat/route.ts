import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, targetNode, model } = await req.json();

        const baseUrl = process.env.HFP_API_BASE_URL;
        const apiKey = process.env.HFP_API_KEY;

        if (!baseUrl) {
            console.error('Missing API base URL');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'X-Target-Node': targetNode || 'default-node',
        };

        // Only add Authorization if API key is provided
        if (apiKey && apiKey !== '[YOUR_KEY_HERE]') {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        // System prompt to restrict domain to medical topics
        const systemMessage = {
            role: 'system',
            content: `You are a specialized medical AI assistant for HealthFirstPriority. Your sole purpose is to provide accurate, professional, and helpful information related to health, medicine, medical conditions, treatments, and wellness.
If a user asks a question that is NOT related to medical or health topics, you must politely decline to answer, stating that you are an AI assistant specialized in medical information only.
Do not engage in general conversation, creative writing, coding, or any other non-medical tasks.
Always prioritize patient safety and recommend seeing a healthcare professional for specific medical advice.`
        };

        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: model || 'Qwen2.5-1.5B-Instruct',
                messages: [systemMessage, ...messages],
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
