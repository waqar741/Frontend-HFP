'use client';

import { PanelLeft, LogIn, LogOut } from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERSONAS } from '@/hooks/useChatStore';
import { Toast, useToast } from '@/components/ui/Toast';

import { useState } from 'react';

export function ChatHeader() {
    const { currentSessionId, sessions, activePersonaId, setActivePersona, customPersonas } = useChatStore();
    const { toggleSidebar } = useUIStore();
    const { isAuthenticated, user, logout, setShowAuthModal } = useAuthStore();
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const { toast, showToast, hideToast } = useToast();

    return (
        <>
            <header className="sticky top-0 z-40 shrink-0 flex h-16 w-full items-center justify-between px-4 bg-background border-b border-border/40">
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
                    {/* Persona Selector */}
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

                    <SettingsDialog />

                    {/* Auth: Sign In button or User Profile Dropdown */}
                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white font-bold text-sm cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
                                    title={user.name}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-popover border-border rounded-xl shadow-xl p-1">
                                <div className="px-3 py-3">
                                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                                </div>
                                <DropdownMenuSeparator className="bg-border/60" />
                                <DropdownMenuItem
                                    onClick={() => logout()}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg mx-1 gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
