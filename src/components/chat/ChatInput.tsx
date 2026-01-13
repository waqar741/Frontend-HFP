'use client';

import { useState, KeyboardEvent } from 'react';
import { Paperclip, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatStore } from '@/hooks/useChatStore';
import { NodeSelector } from './NodeSelector';
import { cn } from '@/lib/utils';

export function ChatInput() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { currentSessionId, addMessage, createNewChat } = useChatStore();

    const handleSend = async () => {
        if (!input.trim()) return;

        let activeSessionId = currentSessionId;
        // Auto-create session if none exists
        if (!activeSessionId) {
            // Since createNewChat is void, we'd normally need to wait for state update or refactor store.
            // For prototype, we'll just not send if no session, or assume user creates one.
            // But let's try to handle it effectively by just creating it in store if possible or prompting.
            // For now, I'll just check if currentSessionId exists. If not, I can trigger createNewChat but I won't have the ID immediately.
            // I'll leave as is with the "Start new chat" hint if empty, or better, auto-trigger it via effect if needed.
            // Limitation: synchronous state update. 
            // Better UX: Show a "New Chat" hint in the empty state (ChatArea handles this). 
            // Here we just guard.
            if (!activeSessionId) {
                // We can't send without an ID.
                return;
            }
        }

        if (!activeSessionId) return;

        const userMessageContent = input;
        setInput('');
        setIsLoading(true);

        addMessage(activeSessionId, { role: 'user', content: userMessageContent });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = {
                role: 'assistant' as const,
                content: `Analysis complete. Based on "${userMessageContent}", here are the findings from the secure HFP node.`
            };

            addMessage(activeSessionId, { role: 'assistant', content: response.content });

        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-hfp-navy">
            <div className="mx-auto max-w-3xl">
                {/* Floating Container */}
                <div className="relative flex flex-col rounded-2xl bg-[#0B1221] border border-slate-800 shadow-xl transition-all focus-within:border-slate-700">

                    {/* Node Selector Row (Optional placement, or inline) */}
                    {/* Reference image usually shows it inside or on top. I'll place it inside at bottom-right or top-right. */}
                    {/* Let's place it inside input area or toolbar. */}

                    <div className="flex items-center gap-2 p-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 shrink-0 h-8 w-8"
                            title="Attach file"
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything..."
                            disabled={!currentSessionId || isLoading}
                            className="flex-1 border-none bg-transparent px-2 text-base text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-2"
                            autoComplete="off"
                        />
                    </div>

                    {/* Bottom Toolbar: Node Selector & Send */}
                    <div className="flex items-center justify-between px-3 pb-3 pt-1">
                        <div className="flex items-center gap-2">
                            <NodeSelector className="" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || !currentSessionId || isLoading}
                                className={cn(
                                    "h-8 w-8 rounded-lg bg-hfp-teal text-white shadow-sm transition-all hover:bg-hfp-teal/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-0"
                                )}
                                title="Send message"
                            >
                                {isLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {!currentSessionId && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-600">Select a chat or start a new conversation to begin.</p>
                    </div>
                )}

                {/* Footer info */}
                <div className="mt-2 text-center">
                    <p className="text-[10px] text-slate-600">
                        HealthFirst Priority Secure Workspace. AI generated content may need verification.
                    </p>
                </div>
            </div>
        </div>
    );
}
