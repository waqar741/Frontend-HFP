'use client';

import { useChatStore } from '@/hooks/useChatStore';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { useState } from 'react';

export function ChatInterface() {
    const { currentSessionId, sessions } = useChatStore();
    const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();

    const currentSession = sessions.find((s) => s.id === currentSessionId);
    const messages = currentSession?.messages || [];

    const handlePromptSelect = (prompt: string) => {
        setSelectedPrompt(prompt);
    };

    // Determine if we are in an "empty" state (no session, or session has no messages)
    const isEmpty = !currentSessionId || messages.length === 0;

    if (isEmpty) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-0 py-4">
                <div className="w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Hero Text */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            HealthFirstPriority
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Upload your health records or ask any medical question to get started.
                        </p>
                    </div>

                    {/* Centered Input */}
                    <ChatInput
                        initialPrompt={selectedPrompt}
                        onPromptReceived={() => setSelectedPrompt(undefined)}
                    />
                </div>
            </div>
        );
    }

    // Active Chat Layout
    return (
        <>
            {/* Chat Area - Takes available space */}
            <ChatArea onPromptSelect={handlePromptSelect} />

            {/* Input Area - Fixed at bottom */}
            <ChatInput
                initialPrompt={selectedPrompt}
                onPromptReceived={() => setSelectedPrompt(undefined)}
            />
        </>
    );
}
