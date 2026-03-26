'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Client-only component that restores auth state from localStorage on mount.
 * Placed in layout.tsx to run on every page load.
 * This avoids reading localStorage during SSR, preventing hydration mismatch.
 */
export function AuthInitializer() {
    const initializeAuth = useAuthStore((s) => s.initializeAuth);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    return null;
}
