import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const baseUrl = process.env.HFP_API_BASE_URL;
        const apiKey = process.env.HFP_API_KEY;

        let useAgent = 'false';
        for (const value of formData.values()) {
            if (value instanceof File) {
                if (value.type === 'application/pdf' || value.type.startsWith('image/')) {
                    useAgent = 'true';
                    break;
                }
            }
        }

        console.log(`[Upload Proxy] Setting X-Use-Agent header to: ${useAgent}`);

        if (!baseUrl) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Forward the request to the upstream API
        let headers: Record<string, string> = {
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
            'X-Use-Agent': useAgent,
        };

        let body: any = formData;

        // If Agent Mode (PDF/Image), send raw file content
        if (useAgent === 'true') {
            const files = Array.from(formData.values()).filter(v => v instanceof File) as File[];
            if (files.length > 0) {
                const file = files[0]; // Take the first file
                const buffer = Buffer.from(await file.arrayBuffer());
                body = buffer;
                headers['Content-Type'] = file.type;
                console.log(`[Upload Proxy] Sending raw file: ${file.name} (${file.type})`);
            }
        }

        const upstreamUrl = `${baseUrl}/v1/upload`;
        console.log(`[Upload Proxy] Forwarding to: ${upstreamUrl}`);
        console.log(`[Upload Proxy] Headers:`, JSON.stringify(headers, null, 2));

        const response = await fetch(upstreamUrl, {
            method: 'POST',
            headers,
            body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Upload API error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: `Upload failed: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in upload proxy:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
