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

    if (!currentSessionId) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 bg-background text-foreground">
                <h1 className="text-4xl font-bold tracking-tight mb-2">HealthFirstPriority</h1>
                <p className="text-muted-foreground text-lg">
                    Upload your health records or ask any medical question to get started.
                </p>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 bg-background text-foreground">
                <h1 className="text-4xl font-bold tracking-tight mb-2">HealthFirstPriority</h1>
                <p className="text-muted-foreground text-lg">
                    Upload your health records or ask any medical question to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
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
                                    'relative max-w-[85%] rounded-2xl px-5 py-3 text-sm md:text-base shadow-sm',
                                    isUser
                                        ? 'bg-hfp-teal text-white rounded-br-none'
                                        : 'bg-muted text-foreground rounded-bl-none'
                                )}
                            >
                                {isUser ? (
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                )}

                                {/* Timestamp (Optional, purely aesthetic hover) */}
                                <div className={cn(
                                    "text-[10px] opacity-50 mt-1 select-none",
                                    isUser ? "text-right text-blue-100" : "text-left text-muted-foreground"
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
