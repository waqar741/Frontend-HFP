import { create } from 'zustand';
import { useChatStore } from '../hooks/useChatStore';
import { safeStorage } from '../lib/storage';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    showAuthModal: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    setShowAuthModal: (open: boolean) => void;
    initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    // Start with unauthenticated defaults — avoids SSR hydration mismatch
    user: null,
    token: null,
    isAuthenticated: false,
    isAuthLoading: true,
    showAuthModal: false,

    login: (user, token) => {
        safeStorage.setItem('token', token);
        safeStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, showAuthModal: false });
        // Fetch cloud-synced user chats
        useChatStore.getState().fetchUserChats(token);
    },

    logout: () => {
        safeStorage.removeItem('token');
        safeStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
        // Wipe local sessions out for privacy
        useChatStore.getState().clearAllSessions();
    },

    setShowAuthModal: (open) => set({ showAuthModal: open }),

    updateUser: (user) => {
        safeStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },

    initializeAuth: async () => {
        const savedToken = safeStorage.getItem('token');
        const savedUser = safeStorage.getItem('user');

        if (!savedToken) {
            set({ isAuthLoading: false });
            return;
        }

        // Restore user from localStorage first (instant, no network needed)
        let parsedUser: User | null = null;
        if (savedUser) {
            try {
                parsedUser = JSON.parse(savedUser);
            } catch {
                parsedUser = null;
            }
        }

        if (parsedUser) {
            set({
                user: parsedUser,
                token: savedToken,
                isAuthenticated: true,
                isAuthLoading: false,
            });
            // Fetch cloud-synced user chats
            useChatStore.getState().fetchUserChats(savedToken);
        } else {
            // Token exists but no user data — try to validate via API
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${savedToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const user = data.user || data;
                    safeStorage.setItem('user', JSON.stringify(user));
                    set({
                        user,
                        token: savedToken,
                        isAuthenticated: true,
                        isAuthLoading: false,
                    });
                    useChatStore.getState().fetchUserChats(savedToken);
                } else {
                    // Token is invalid — clean up
                    safeStorage.removeItem('token');
                    safeStorage.removeItem('user');
                    set({ user: null, token: null, isAuthenticated: false, isAuthLoading: false });
                }
            } catch {
                // Network error — keep token, mark as not loading but unauthenticated
                // so UI doesn't flash, user can still try
                safeStorage.removeItem('token');
                safeStorage.removeItem('user');
                set({ user: null, token: null, isAuthenticated: false, isAuthLoading: false });
            }
        }
    },
}));
