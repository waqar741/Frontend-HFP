import { create } from 'zustand';
import { useChatStore } from '../hooks/useChatStore';
import { safeStorage } from '../lib/storage';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    showAuthModal: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    setShowAuthModal: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: safeStorage.getItem('token'),
    isAuthenticated: !!safeStorage.getItem('token'),
    showAuthModal: false,
    login: (user, token) => {
        safeStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, showAuthModal: false });
        // Fetch cloud-synced user chats
        useChatStore.getState().fetchUserChats(token);
    },
    logout: () => {
        safeStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
        // Wipe local sessions out for privacy
        useChatStore.getState().clearAllSessions();
    },
    setShowAuthModal: (open) => set({ showAuthModal: open }),
}));
