// Auth API URL: In production, Caddy proxies /api/auth/* to the Go orchestrator.
// In local dev, you can set NEXT_PUBLIC_API_URL to point directly to the Go server.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/auth';

export const loginUser = async (email: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }
    return response.json();
};

export const signupUser = async (name: string, email: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
    }
    return response.json();
};

export const forgotPassword = async (email: string): Promise<any> => {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }
    return response.json();
};

export const resetPassword = async (token: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reset failed');
    }
    return response.json();
};
