'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

interface ToastProps {
    message: string;
    show: boolean;
    onClose: () => void;
    duration?: number;
    icon?: 'lock' | 'info';
}

export function Toast({ message, show, onClose, duration = 2500, icon = 'lock' }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClose, 300);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show && !visible) return null;

    return (
        <div className={`fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <div className="flex items-center gap-2 rounded-full bg-zinc-900 dark:bg-zinc-800 border border-zinc-700/50 px-4 py-2.5 text-sm text-zinc-100 shadow-xl shadow-black/20 backdrop-blur-md">
                {icon === 'lock' && <Lock className="h-3.5 w-3.5 text-primary shrink-0" />}
                <span className="whitespace-nowrap">{message}</span>
            </div>
        </div>
    );
}

// Hook for easy toast management
export function useToast() {
    const [toast, setToast] = useState<{ message: string; icon?: 'lock' | 'info' } | null>(null);

    const showToast = (message: string, icon: 'lock' | 'info' = 'lock') => {
        setToast({ message, icon });
    };

    const hideToast = () => setToast(null);

    return { toast, showToast, hideToast };
}
