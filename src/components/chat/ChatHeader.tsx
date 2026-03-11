'use client';

import { PanelLeft, Lock, LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/hooks/useChatStore';
import { useUIStore } from '@/hooks/useUIStore';
import { useAuthStore } from '@/store/authStore';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PERSONAS } from '@/hooks/useChatStore';
import { Toast, useToast } from '@/components/ui/Toast';

import { useState } from 'react';

export function ChatHeader() {
    const { currentSessionId, sessions, activePersonaId, setActivePersona, customPersonas } = useChatStore();
    const { toggleSidebar } = useUIStore();
    const { isAuthenticated, user, setShowAuthModal } = useAuthStore();
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const { toast, showToast, hideToast } = useToast();

    const handleLockedPersonaTap = () => {
        if (!isAuthenticated) {
            showToast('Sign in to consult specialists');
        }
    };

    return (
        <>
            <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between px-4 backdrop-blur-md bg-background/80 border-b border-border/40">
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

                    {/* App title (mobile) */}
                    <span className="font-bold text-sm md:hidden text-foreground">
                        <span className="text-primary">Health</span>FirstPriority
                    </span>
                </div>

                <div className="flex items-center gap-3 text-foreground">
                    {/* Persona Selector */}
                    {isAuthenticated ? (
                        <Select value={activePersonaId} onValueChange={setActivePersona}>
                            <SelectTrigger className="w-[180px] h-9 bg-background/50 border-border/50 text-sm focus:ring-1 focus:ring-ring focus:border-transparent">
                                <SelectValue placeholder="Select Specialty" />
                            </SelectTrigger>
                            <SelectContent>
                                {PERSONAS.map(persona => (
                                    <SelectItem key={persona.id} value={persona.id} title={persona.description}>
                                        {persona.name}
                                    </SelectItem>
                                ))}
                                {customPersonas.length > 0 && (
                                    <>
                                        <div className="h-px bg-border my-1" />
                                        <div className="px-2 py-1">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Custom</p>
                                        </div>
                                        {customPersonas.map(cp => (
                                            <SelectItem key={cp.id} value={cp.id}>
                                                ✨ {cp.name}
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <button
                            onClick={handleLockedPersonaTap}
                            className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border/50 bg-background/50 text-sm text-muted-foreground cursor-not-allowed opacity-70 transition-colors"
                        >
                            <Lock className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">General Practitioner</span>
                            <span className="sm:hidden">GP</span>
                            <span className="text-[10px]"></span>
                        </button>
                    )}

                    <SettingsDialog />

                    {/* Auth: Sign In button or User Avatar */}
                    {isAuthenticated && user ? (
                        <div
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white font-bold text-sm cursor-default shadow-md"
                            title={user.name}
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setShowAuthModal(true)}
                            className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all gap-1.5"
                        >
                            <LogIn className="h-4 w-4" />
                            <span className="hidden sm:inline">Sign In</span>
                        </Button>
                    )}
                </div>
            </header>

            {/* Toast */}
            {toast && (
                <Toast message={toast.message} show={!!toast} onClose={hideToast} icon={toast.icon} />
            )}
        </>
    );
}
