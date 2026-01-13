'use client';

import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/hooks/useChatStore';
import { useUIStore } from '@/hooks/useUIStore';
import { SettingsDialog } from '@/components/settings/SettingsDialog';

export function ChatHeader() {
    const { currentSessionId, sessions } = useChatStore();
    const { toggleSidebar } = useUIStore();
    const currentSession = sessions.find(s => s.id === currentSessionId);

    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/10">
            <div className="flex items-center gap-4">
                {/* Sidebar Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-muted-foreground hover:text-foreground hidden md:flex"
                    title="Toggle Sidebar"
                >
                    <PanelLeft className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex items-center gap-3 text-foreground">
                <SettingsDialog />
            </div>
        </header>
    );
}
