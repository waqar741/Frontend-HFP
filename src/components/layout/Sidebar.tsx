'use client';

import { Plus, Search, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/hooks/useChatStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function Sidebar() {
    const { sessions, currentSessionId, createNewChat, selectSession, deleteSession } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        deleteSession(sessionId);
    };

    return (
        <div className="flex h-full w-full flex-col bg-hfp-card text-slate-100">
            {/* Header / Logo Area */}
            <div className="flex h-16 items-center px-6">
                <h1 className="text-xl font-bold tracking-tight text-hfp-teal">
                    HealthFirst<span className="text-white">Priority</span>
                </h1>
            </div>

            {/* New Chat Action */}
            <div className="px-4 pb-4">
                <Button
                    className="w-full justify-start gap-2 bg-hfp-teal text-white hover:bg-hfp-teal/90"
                    size="lg"
                    onClick={createNewChat}
                >
                    <Plus className="h-5 w-5" />
                    New Chat
                </Button>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search history..."
                        className="pl-9 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-hfp-teal"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Chat History List */}
            <div className="flex-1 px-4 pb-4 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-2">
                        <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Recent
                        </h3>
                        {filteredSessions.length === 0 ? (
                            <p className="px-2 text-sm text-slate-500 italic">No chats found.</p>
                        ) : (
                            filteredSessions.map((session) => (
                                <Button
                                    key={session.id}
                                    variant="ghost"
                                    className={cn(
                                        "group w-full justify-between gap-2 px-2 text-slate-300 hover:bg-slate-800 hover:text-white",
                                        currentSessionId === session.id && "bg-slate-800/80 text-white font-medium"
                                    )}
                                    onClick={() => selectSession(session.id)}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <MessageSquare className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{session.title}</span>
                                    </div>
                                    <div
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 cursor-pointer rounded transition-opacity"
                                        onClick={(e) => handleDelete(e, session.id)}
                                        title="Delete chat"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </div>
                                </Button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* User Footer */}
            <div className="border-t border-slate-700 p-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-hfp-teal/20 flex items-center justify-center text-hfp-teal font-bold">
                        U
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">User Account</span>
                        <span className="text-xs text-slate-400">user@hfp.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
