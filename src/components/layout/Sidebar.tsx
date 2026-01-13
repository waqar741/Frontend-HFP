'use client';

import { Plus, Search, MessageSquare, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/hooks/useChatStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { SettingsDialog } from '@/components/settings/SettingsDialog';

export function Sidebar() {
    const { sessions, currentSessionId, createNewChat, selectSession, deleteSession } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="bg-hfp-teal h-8 w-8 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">H</span>
                    </div>
                    <span className="font-bold text-xl text-slate-100">HFP</span>
                </div>
                {/* Settings Dialog Trigger */}
                <SettingsDialog />
            </div>

            {/* New Chat Button */}
            <Button
                onClick={() => createNewChat()}
                className="w-full justify-start gap-2 bg-hfp-teal hover:bg-hfp-teal/90 text-white mb-4"
            >
                <Plus className="h-5 w-5" />
                New Chat
            </Button>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search conversations"
                    className="pl-8 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-hfp-teal"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-hidden -mx-2 px-2">
                <p className="text-xs font-semibold text-slate-500 mb-2 px-2">Conversations</p>
                <ScrollArea className="h-full">
                    {filteredSessions.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 py-4">
                            No conversations found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={cn(
                                        "group flex items-center gap-2 rounded-lg p-2 text-sm transition-colors cursor-pointer",
                                        currentSessionId === session.id
                                            ? "bg-slate-800 text-slate-100"
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                                    )}
                                    onClick={() => selectSession(session.id)}
                                >
                                    <MessageSquare className="h-4 w-4 shrink-0" />
                                    <span className="flex-1 truncate">
                                        {session.title}
                                    </span>
                                    {/* Delete Action */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(session.id);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* User Footer */}
            <div className="mt-4 border-t border-slate-700 pt-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                        DR
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-slate-200">Dr. Smith</p>
                        <p className="truncate text-xs text-slate-500">Cardiology Dept.</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
