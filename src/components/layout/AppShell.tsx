'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/hooks/useUIStore';
import { cn } from '@/lib/utils';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const { isSidebarOpen } = useUIStore();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Desktop Sidebar - Responsive visibility */}
            <aside
                className={cn(
                    "hidden border-r border-slate-700/50 bg-sidebar transition-all duration-300 md:flex md:flex-col",
                    isSidebarOpen ? "w-[280px]" : "w-0 overflow-hidden border-none"
                )}
            >
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex flex-1 flex-col overflow-hidden relative">

                {/* Content Wrapper */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
