'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

export function ChatArea() {
    const { sessions, currentSessionId } = useChatStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    const currentSession = sessions.find((s) => s.id === currentSessionId);
    const messages = currentSession?.messages || [];

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!currentSession) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-slate-500">
                <p>Select a chat or start a new one.</p>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-slate-500">
                <Bot className="h-12 w-12 mb-4 text-hfp-teal/50" />
                <p className="text-lg font-medium">How can I help you today?</p>
                <p className="text-sm text-slate-600">HealthFirst Priority Secure AI</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
            <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={cn(
                            "flex w-full items-start gap-3",
                            message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        {/* Avatar for Assistant */}
                        {message.role === 'assistant' && (
                            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-hfp-card border border-slate-700">
                                <Bot className="h-4 w-4 text-hfp-teal" />
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div
                            className={cn(
                                "relative max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm",
                                message.role === 'user'
                                    ? "bg-hfp-teal text-white"
                                    : "bg-hfp-card text-slate-100 border border-slate-700"
                            )}
                        >
                            {message.content}
                        </div>

                        {/* Avatar for User */}
                        {message.role === 'user' && (
                            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-hfp-teal/20 border border-slate-700">
                                <User className="h-4 w-4 text-hfp-teal" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
