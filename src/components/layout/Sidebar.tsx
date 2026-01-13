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

    return (
        <div className="flex h-full flex-col p-4 bg-hfp-navy md:bg-hfp-card">
            {/* Header */}
            <div className="flex items-center gap-2 mb-8 px-2">
                <span className="font-bold text-lg text-white tracking-wide">HealthFirstPriority</span>
            </div>

            {/* New Chat Button */}
            <Button
                onClick={() => createNewChat()}
                variant="outline"
                className="w-full justify-start gap-2 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white mb-6"
            >
                <Plus className="h-4 w-4" />
                New chat
            </Button>

            {/* Search */}
            <div className="relative mb-6 px-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search conversations"
                    className="pl-9 h-9 bg-transparent border-none text-slate-300 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-hidden -mx-2 px-2">
                <p className="text-xs font-semibold text-slate-600 mb-2 px-3">Conversations</p>
                <ScrollArea className="h-full">
                    {filteredSessions.length === 0 ? (
                        <div className="text-center text-sm text-slate-600 py-4">
                            No conversations found.
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filteredSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={cn(
                                        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
                                        currentSessionId === session.id
                                            ? "bg-slate-800/80 text-white"
                                            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                                    )}
                                    onClick={() => selectSession(session.id)}
                                >
                                    <span className="flex-1 truncate">
                                        {session.title}
                                    </span>
                                    {/* Delete Action (Hidden by default, shown on group hover or active) */}
                                    <div className={cn(
                                        "opacity-0 transition-opacity",
                                        "group-hover:opacity-100",
                                        currentSessionId === session.id && "opacity-100"
                                    )}>
                                        {/* Simple menu or delete */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-transparent"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSession(session.id);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
