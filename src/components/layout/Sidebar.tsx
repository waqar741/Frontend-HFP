'use client';

import { Plus, Search, MessageSquare, MoreHorizontal, Pencil, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/hooks/useChatStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
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
import { exportChatToText } from '@/lib/export-utils';

export function Sidebar() {
    const { sessions, currentSessionId, createNewChat, selectSession, deleteSession, renameSession } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog States
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToEdit, setSessionToEdit] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    const handleExport = (id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            exportChatToText(session);
        }
    }

    return (
        <div className="flex h-full flex-col p-4 bg-sidebar border-r border-border">
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
            <div className="flex-1 overflow-hidden -mx-2 px-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">Conversations</p>
                <ScrollArea className="h-full">
                    {filteredSessions.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            No conversations found.
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filteredSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={cn(
                                        "group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
                                        currentSessionId === session.id
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                    )}
                                    onClick={() => selectSession(session.id)}
                                >
                                    <span className="flex-1 truncate">
                                        {session.title}
                                    </span>

                                    {/* Menu Actions */}
                                    <div className={cn(
                                        "opacity-0 transition-opacity",
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
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExport(session.id); }}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Export
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
