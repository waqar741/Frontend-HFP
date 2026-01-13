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
        <div className="flex h-screen w-full overflow-hidden bg-hfp-navy">
            {/* Desktop Sidebar - Responsive visibility */}
            <aside
                className={cn(
                    "hidden border-r border-slate-700 bg-hfp-card transition-all duration-300 md:flex md:flex-col",
                    isSidebarOpen ? "w-[280px]" : "w-0 overflow-hidden border-none"
                )}
            >
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex flex-1 flex-col overflow-hidden relative">
                {/* Mobile Header - Visible only on mobile */}
                <div className="flex items-center border-b border-slate-700 p-4 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-100 hover:bg-slate-800">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] p-0 border-r border-slate-700 bg-hfp-card">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                    <span className="ml-4 font-semibold text-slate-100">HealthFirstPriority</span>
                </div>

                {/* Content Wrapper */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
