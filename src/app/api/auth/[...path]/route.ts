import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getAuthApiBaseUrl() {
    const configuredBaseUrl =
        process.env.AUTH_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.HFP_API_BASE_URL ||
        'http://localhost:8095';

    const normalizedBaseUrl = configuredBaseUrl.replace(/\/$/, '');
    return normalizedBaseUrl.endsWith('/api/auth')
        ? normalizedBaseUrl
        : `${normalizedBaseUrl}/api/auth`;
}

async function proxyAuthRequest(req: NextRequest, path: string[]) {
    try {
        const requestUrl = new URL(req.url);
        const upstreamUrl = new URL(`${getAuthApiBaseUrl()}/${path.map(encodeURIComponent).join('/')}`);
        upstreamUrl.search = requestUrl.search;

        const headers = new Headers();
        const authorization = req.headers.get('authorization');
        const contentType = req.headers.get('content-type');
        const accept = req.headers.get('accept');

        if (authorization) {
            headers.set('Authorization', authorization);
        }
        if (contentType) {
            headers.set('Content-Type', contentType);
        }
        if (accept) {
            headers.set('Accept', accept);
        }

        const body = req.method === 'GET' || req.method === 'HEAD'
            ? undefined
            : await req.arrayBuffer();

        const response = await fetch(upstreamUrl, {
            method: req.method,
            headers,
            body,
            cache: 'no-store',
        });

        const responseHeaders = new Headers();
        const responseContentType = response.headers.get('content-type');
        const cacheControl = response.headers.get('cache-control');

        if (responseContentType) {
            responseHeaders.set('Content-Type', responseContentType);
        }
        if (cacheControl) {
            responseHeaders.set('Cache-Control', cacheControl);
        }

        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Error in auth proxy:', error);
        return NextResponse.json(
            { error: 'Failed to reach authentication service' },
            { status: 502 }
        );
    }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    return proxyAuthRequest(req, path);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    return proxyAuthRequest(req, path);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    return proxyAuthRequest(req, path);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    return proxyAuthRequest(req, path);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    return proxyAuthRequest(req, path);
}

export async function OPTIONS(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    return proxyAuthRequest(req, path);
}