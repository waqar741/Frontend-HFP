import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    guestMessageCount: number;
    showAuthModal: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    incrementGuestCount: () => void;
    setShowAuthModal: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('token')),
    guestMessageCount: 0,
    showAuthModal: false,
    login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, showAuthModal: false, guestMessageCount: 0 });
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, guestMessageCount: 0 });
    },
    incrementGuestCount: () => set((state) => ({ guestMessageCount: state.guestMessageCount + 1 })),
    setShowAuthModal: (open) => set({ showAuthModal: open }),
}));
