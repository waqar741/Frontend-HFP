'use client';

import { useChatStore } from '@/hooks/useChatStore';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export function ChatArea() {
    const { currentSessionId, sessions } = useChatStore();
    const currentSession = sessions.find((s) => s.id === currentSessionId);
    const messages = currentSession?.messages || [];
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (!currentSessionId || messages.length === 0) {
        return null; // Interface wrapper handles empty state
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent">
            <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message) => {
                    const isUser = message.role === 'user';
                    return (
                        <div
                            key={message.id}
                            className={cn(
                                'flex w-full',
                                isUser ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'relative max-w-[85%] rounded-2xl px-5 py-4 text-sm md:text-base shadow-md transition-all',
                                    isUser
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none border border-blue-500/20'
                                        : 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 rounded-bl-none border border-slate-700/50'
                                )}
                            >
                                {isUser ? (
                                    <p className="whitespace-pre-wrap leading-relaxed font-sans">{message.content}</p>
                                ) : (
                                    <div className="prose prose-sm prose-invert max-w-none leading-relaxed prose-p:text-slate-200 prose-headings:text-slate-100 prose-code:text-blue-300">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                )}

                                {/* Timestamp */}
                                <div className={cn(
                                    "text-[10px] mt-2 select-none font-medium",
                                    isUser ? "text-right text-blue-200/60" : "text-left text-slate-500"
                                )}>
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>
        </div>
    );
}
