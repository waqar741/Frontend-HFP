const API_URL = '/api/auth';

async function parseAuthResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();

    let parsedBody: any = null;
    if (rawBody && contentType.includes('application/json')) {
        try {
            parsedBody = JSON.parse(rawBody);
        } catch {
            parsedBody = null;
        }
    }

    if (!response.ok) {
        const message =
            parsedBody?.error ||
            parsedBody?.message ||
            `${fallbackMessage} (${response.status} ${response.statusText})`;
        throw new Error(message);
    }

    if (!rawBody) {
        return {} as T;
    }

    if (parsedBody !== null) {
        return parsedBody as T;
    }

    throw new Error('Authentication service returned an invalid response');
}

export const loginUser = async (email: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return parseAuthResponse(response, 'Login failed');
};

export const signupUser = async (name: string, email: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    return parseAuthResponse(response, 'Signup failed');
};

export const forgotPassword = async (email: string): Promise<any> => {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return parseAuthResponse(response, 'Request failed');
};

export const resetPassword = async (token: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
    });
    return parseAuthResponse(response, 'Reset failed');
};
