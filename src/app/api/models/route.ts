import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    try {
        const baseUrl = process.env.HFP_API_BASE_URL;
        const apiKey = process.env.HFP_API_KEY;

        if (!baseUrl || !apiKey) {
            console.error('Missing API configuration');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const response = await fetch(`${baseUrl}/v1/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Upstream API error: ${response.status}`);
            return NextResponse.json(
                { error: 'Failed to fetch models' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in models proxy:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
