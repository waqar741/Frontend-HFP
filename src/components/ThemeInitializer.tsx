'use client';

import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeInitializer() {
    const { theme } = useTheme();

    useEffect(() => {
        console.log('Theme initialized:', theme);
    }, [theme]);

    return null;
}
