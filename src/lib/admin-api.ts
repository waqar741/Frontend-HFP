const ADMIN_API = '/api/auth/admin';

// --- HARDCODED ADMIN SETTINGS ---
// Remove or set to false before pushing to production
export const HARDCODED_ADMIN_MODE = true;
export const HARDCODED_CREDENTIALS = {
    email: 'admin@healthfirstpriority.com',
    password: 'admin'
};

let mockBroadcasts = [
    { id: 'b1', message: 'System maintenance scheduled for tonight.', is_active: true, created_at: new Date().toISOString() },
    { id: 'b2', message: 'Welcome to the platform administrator.', is_active: false, created_at: new Date(Date.now() - 86400000).toISOString() }
];

const mockData = {
    dashboard: {
        totalUsers: 154,
        adminUsers: 3,
        totalSessions: 1250,
        totalMessages: 5432,
        recentUsers: [
            { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', created_at: new Date().toISOString() }
        ]
    },
    users: {
        users: [
            { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', created_at: new Date().toISOString() },
            { id: 'hardcoded-admin', name: 'Admin', email: 'admin', role: 'admin', created_at: new Date().toISOString() }
        ],
        total: 2,
        page: 1,
        limit: 50
    },
    settings: {
        siteName: 'Distributed Inference',
        maintenanceMode: 'false',
        registrationEnabled: 'true'
    },
    systemStats: {
        nodes: [
            { address: '100.64.0.2:8080', status: 'healthy', response_time_ms: 12.5, last_checked: new Date().toISOString(), consecutive_failures: 0 },
            { address: '100.64.0.3:8080', status: 'healthy', response_time_ms: 15.2, last_checked: new Date().toISOString(), consecutive_failures: 0 },
            { address: '100.64.0.4:8080', status: 'degraded', response_time_ms: 250.4, last_checked: new Date().toISOString(), consecutive_failures: 0, error_message: 'High latency' }
        ],
        total_nodes: 3,
        healthy_nodes: 2,
        degraded_nodes: 1,
        down_nodes: 0,
        circuit_breaker_state: 'closed',
        uptime: '2h 15m 30s'
    }
};

async function mockAdminFetch(url: string, options: RequestInit = {}) {
    await new Promise(r => setTimeout(r, 400));
    if (url.includes('/dashboard')) return mockData.dashboard;
    if (url.includes('/users')) {
        if (options.method === 'POST') return mockData.users.users[0];
        if (options.method === 'PUT' || options.method === 'DELETE') return { status: 'success' };
        return mockData.users;
    }
    if (url.includes('/broadcasts')) {
        if (options.method === 'POST') {
            const message = JSON.parse(options.body as string).message;
            const newB = { id: Math.random().toString(), message, is_active: true, created_at: new Date().toISOString() };
            mockBroadcasts.push(newB);
            return { message: 'Created', id: newB.id };
        }
        if (options.method === 'PUT') {
            const { id, is_active } = JSON.parse(options.body as string);
            const b = mockBroadcasts.find(x => x.id === id);
            if (b) b.is_active = is_active;
            return { status: 'success' };
        }
        if (options.method === 'DELETE') {
            const idMatch = url.match(/id=([^&]*)/);
            const id = idMatch ? decodeURIComponent(idMatch[1]) : '';
            mockBroadcasts = mockBroadcasts.filter(x => x.id !== id);
            return { status: 'success' };
        }
        return mockBroadcasts;
    }
    if (url.includes('/settings')) {
        if (options.method === 'PUT') return { message: 'Settings updated' };
        return mockData.settings;
    }
    if (url.includes('/system-stats')) {
        return mockData.systemStats;
    }
    throw new Error('Not found in mock');
}
// --------------------------------

async function adminFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (HARDCODED_ADMIN_MODE && token === 'hardcoded-token') {
        return mockAdminFetch(url, options) as any as T;
    }

    if (!token) throw new Error('Not authenticated');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });
    const text = await response.text();
    let data: any = null;

    try {
        data = JSON.parse(text);
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.error || `Request failed (${response.status})`);
    }

    return data as T;
}

// --- Types ---
export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    created_at: string;
}

export interface DashboardStats {
    totalUsers: number;
    adminUsers: number;
    totalSessions: number;
    totalMessages: number;
    recentUsers: AdminUser[];
}

// --- Dashboard ---
export async function fetchDashboardStats(): Promise<DashboardStats> {
    return adminFetch<DashboardStats>(`${ADMIN_API}/dashboard`);
}

export interface PaginatedAdminUsers {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
}

// --- Users CRUD ---
export async function fetchUsers(page = 1, limit = 50, search = ''): Promise<PaginatedAdminUsers> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
    });
    return adminFetch<PaginatedAdminUsers>(`${ADMIN_API}/users?${params.toString()}`);
}

export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
}): Promise<AdminUser> {
    return adminFetch<AdminUser>(`${ADMIN_API}/users`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateUser(data: {
    id: string;
    name?: string;
    email?: string;
    password?: string;
    role?: string;
}): Promise<{ status: string }> {
    return adminFetch<{ status: string }>(`${ADMIN_API}/users`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteUser(id: string): Promise<{ status: string }> {
    return adminFetch<{ status: string }>(`${ADMIN_API}/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

// --- Broadcasts ---
export interface Broadcast {
    id: string;
    message: string;
    is_active: boolean;
    created_at: string;
}

export async function fetchBroadcasts(): Promise<Broadcast[]> {
    return adminFetch<Broadcast[]>(`${ADMIN_API}/broadcasts`);
}

export async function createBroadcast(message: string): Promise<{ message: string; id: string }> {
    return adminFetch<{ message: string; id: string }>(`${ADMIN_API}/broadcasts`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export async function updateBroadcast(id: string, is_active: boolean): Promise<{ status: string }> {
    return adminFetch<{ status: string }>(`${ADMIN_API}/broadcasts`, {
        method: 'PUT',
        body: JSON.stringify({ id, is_active }),
    });
}

export async function deleteBroadcast(id: string): Promise<{ status: string }> {
    return adminFetch<{ status: string }>(`${ADMIN_API}/broadcasts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

// --- Settings ---
export async function fetchSettings(): Promise<Record<string, string>> {
    return adminFetch<Record<string, string>>(`${ADMIN_API}/settings`);
}

export async function updateSettings(settings: Record<string, string>): Promise<{ message: string }> {
    return adminFetch<{ message: string }>(`${ADMIN_API}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
}

// --- System Status (Monitoring) ---
export interface NodeStatus {
    address: string;
    status: string; // 'healthy', 'degraded', 'down'
    response_time_ms: number;
    last_checked: string;
    consecutive_failures: number;
    error_message?: string;
}

export interface SystemStats {
    nodes: NodeStatus[];
    total_nodes: number;
    healthy_nodes: number;
    degraded_nodes: number;
    down_nodes: number;
    circuit_breaker_state: string; // 'closed', 'open', 'half-open'
    uptime: string;
}

export async function fetchSystemStats(): Promise<SystemStats> {
    return adminFetch<SystemStats>(`${ADMIN_API}/system-stats`);
}
