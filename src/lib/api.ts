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
    // ⚠️ HARDCODED TEST ACCOUNT — REMOVE IN PRODUCTION
    if (email === 'test@test.com' && password === 'test123') {
        return {
            user: { id: 'test-user-001', name: 'Test User', email: 'test@test.com' },
            token: 'test-token-hardcoded-for-local-dev',
        };
    }

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return parseAuthResponse(response, 'Login failed');
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

export const updateUserName = async (token: string, name: string): Promise<any> => {
    const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
    });
    return parseAuthResponse(response, 'Failed to update name');
};

export const changePassword = async (
    token: string,
    currentPassword: string,
    newPassword: string
): Promise<any> => {
    const response = await fetch(`${API_URL}/change-password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return parseAuthResponse(response, 'Failed to change password');
};
