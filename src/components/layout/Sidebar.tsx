'use client';

import { Plus, Search, MessageSquare, MoreHorizontal, Pencil, Trash2, Download, FileText, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/hooks/useChatStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { exportChatToText, exportChatToPDF } from '@/lib/export-utils';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';
import { Toast, useToast } from '@/components/ui/Toast';

export function Sidebar() {
    const { sessions, currentSessionId, createNewChat, selectSession, deleteSession, renameSession, fetchUserChats } = useChatStore();
    const { user, token, isAuthenticated, isAuthLoading, logout, setShowAuthModal } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [libraryOpen, setLibraryOpen] = useState(false);
    const { toast, showToast, hideToast } = useToast();

    // Dialog States
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToEdit, setSessionToEdit] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');

    // Fetch cloud-synced chats for authenticated returning users
    useEffect(() => {
        if (isAuthenticated && token) {
            fetchUserChats(token);
        }
    }, [isAuthenticated, token, fetchUserChats]);

    const filteredSessions = sessions.filter(session => {
        const query = searchQuery.toLowerCase();
        if (session.title.toLowerCase().includes(query)) return true;
        return session.messages.some(msg =>
            msg.content && msg.content.toLowerCase().includes(query)
        );
    });

    const handleEditClick = (id: string, currentTitle: string) => {
        setSessionToEdit(id);
        setNewTitle(currentTitle);
        setRenameDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setSessionToEdit(id);
        setDeleteDialogOpen(true);
    };

    const confirmRename = () => {
        if (sessionToEdit && newTitle.trim()) {
            renameSession(sessionToEdit, newTitle.trim());
            setRenameDialogOpen(false);
            setSessionToEdit(null);
        }
    };

    const confirmDelete = () => {
        if (sessionToEdit) {
            deleteSession(sessionToEdit);
            setDeleteDialogOpen(false);
            setSessionToEdit(null);
        }
    };

    const handleExportTxt = (id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            exportChatToText(session);
        }
    }

    const handleExportPdf = (id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            exportChatToPDF(session);
        }
    }

    const handleLockedLibrary = () => {
        showToast('Please log in to access Document Library');
    };

    return (
        <div className="flex h-full w-full overflow-hidden flex-col p-4 bg-sidebar border-r border-border">
            {/* Header */}
            <div className="flex items-center gap-2 mb-8 px-2">
                <span className="font-bold text-lg tracking-wide">
                    <span className="text-primary">Health</span>
                    <span className="text-sidebar-foreground">FirstPriority</span>
                </span>
            </div>

            {/* New Chat Button */}
            <Button
                onClick={() => createNewChat()}
                variant="outline"
                className="w-full justify-start gap-2 border-sidebar-border bg-sidebar-accent/10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-6"
            >
                <Plus className="h-4 w-4" />
                New chat
            </Button>

            {/* Chat List Area */}
            {/* Search */}
            <div className="relative mb-6 px-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search conversations"
                    className="pl-9 h-9 bg-transparent border-none text-sidebar-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-hidden -mx-2 px-2 flex flex-col min-h-0">
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-3 shrink-0">Conversations</p>
                    <ScrollArea className="flex-1 w-full">
                        {filteredSessions.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-4">
                                No conversations found.
                            </div>
                        ) : (
                            <div className="space-y-0.5 w-full pr-3">
                                {filteredSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            "group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer w-full overflow-hidden",
                                            currentSessionId === session.id
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                        )}
                                        onClick={() => selectSession(session.id)}
                                    >
                                        <span className="flex-1 min-w-0 truncate">
                                            {session.title.length > 23 ? session.title.slice(0, 25) + '...' : session.title}
                                        </span>

                                        {/* Menu Actions */}
                                        <div className={cn(
                                            "opacity-0 transition-opacity shrink-0",
                                            "group-hover:opacity-100",
                                            currentSessionId === session.id && "opacity-100"
                                        )}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-sidebar-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-popover border-border">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(session.id, session.title); }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExportPdf(session.id); }}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Export as PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border" />
                                                    <DropdownMenuItem
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(session.id); }}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
            </div>

            {/* Document Library button */}
            <div className="mt-4 pt-3 border-t border-sidebar-border shrink-0">
                <Button
                    variant="ghost"
                    onClick={() => setLibraryOpen(true)}
                    className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                >
                    <BookOpen className="h-4 w-4" />
                    Document Library
                </Button>
            </div>

            <DocumentLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />

            {/* Auth Section */}
            <div className="mt-4 pt-3 border-t border-sidebar-border shrink-0">
                {isAuthLoading ? (
                    /* Skeleton while auth state is being restored */
                    <div className="flex items-center gap-2 px-2 py-2 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-muted/30 shrink-0" />
                        <div className="h-4 w-24 rounded bg-muted/30" />
                    </div>
                ) : isAuthenticated && user ? (
                    <div className="flex items-center justify-between w-full px-2 py-2 text-sm text-sidebar-foreground">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                                <span className="font-bold">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="truncate">{user.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout" className="text-muted-foreground hover:text-destructive shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        onClick={() => setShowAuthModal(true)}
                        className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" x2="3" y1="12" y2="12"></line></svg>
                        Login
                    </Button>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <Toast message={toast.message} show={!!toast} onClose={hideToast} icon={toast.icon} />
            )}

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border text-card-foreground">
                    <DialogHeader>
                        <DialogTitle>Edit Conversation Name</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Enter a new specific name for this conversation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input
                            id="name"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="bg-input border-border text-foreground"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="border-border text-foreground hover:bg-accent">Cancel</Button>
                        <Button onClick={confirmRename} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border text-card-foreground">
                    <DialogHeader>
                        <DialogTitle>Delete Conversation</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Are you sure you want to delete this? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-border text-foreground hover:bg-accent">Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
