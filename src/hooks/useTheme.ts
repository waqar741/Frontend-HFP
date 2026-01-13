'use client';

import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('dark'); // Default to dark for this app

    useEffect(() => {
        // Load persisted theme
        const savedTheme = localStorage.getItem('hfp-theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        // Persist
        localStorage.setItem('hfp-theme', theme);
    }, [theme]);

    // Force hfp-navy background if dark mode (optional, handled by global css variables usually)
    // But our Tailwind config uses classes. 

    return { theme, setTheme };
}
