'use client';

import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/hooks/useChatStore';
import { useUIStore } from '@/hooks/useUIStore';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import { useState } from 'react';

export function ChatHeader() {
    const { currentSessionId, sessions } = useChatStore();
    const { toggleSidebar } = useUIStore();
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between px-4 backdrop-blur-md bg-background/80 border-b border-white/5">
            <div className="flex items-center gap-4">
                {/* Desktop Sidebar Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-muted-foreground hover:text-foreground hidden md:flex"
                    title="Toggle Sidebar"
                >
                    <PanelLeft className="h-5 w-5" />
                </Button>

                {/* Mobile Sidebar Sheet */}
                <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground md:hidden"
                            title="Open Menu"
                        >
                            <PanelLeft className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] p-0 border-r border-slate-700/50 bg-sidebar">
                        <Sidebar />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="flex items-center gap-3 text-foreground">
                <SettingsDialog />
            </div>
        </header>
    );
}
