import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    try {
        const response = await fetch('https://ai.nomineelife.com/api/nodes', {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Upstream API error: ${response.status}`);
            return NextResponse.json(
                { error: 'Failed to fetch nodes' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in nodes proxy:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
