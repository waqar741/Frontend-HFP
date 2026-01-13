'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/hooks/useChatStore';
import { NodeSelector } from './NodeSelector';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export function ChatInput() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { currentSessionId, addMessage, createNewChat } = useChatStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim()) return;

        let activeSessionId = currentSessionId;

        // If no session active, or current is null, create one (store ensures no duplicate empties)
        if (!activeSessionId) {
            activeSessionId = createNewChat();
        }

        const userMessageContent = input;
        setInput('');
        setIsLoading(true);

        addMessage(activeSessionId, {
            id: uuidv4(),
            role: 'user',
            content: userMessageContent,
            timestamp: Date.now()
        });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = {
                role: 'assistant' as const,
                content: `Analysis complete. Based on "${userMessageContent}", here are the findings from the secure HFP node.`
            };

            addMessage(activeSessionId, {
                id: uuidv4(),
                role: 'assistant',
                content: response.content,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-background">
            <div className="mx-auto max-w-3xl">
                {/* Floating Container - Dark Navy Card */}
                <div className="relative flex flex-col rounded-3xl bg-[#0f172a] border border-slate-800 shadow-2xl transition-all focus-within:border-blue-500/30 min-h-[120px]">

                    {/* Top: Text Area */}
                    <div className="p-4 pb-2">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything..."
                            disabled={isLoading}
                            rows={1}
                            className="w-full resize-none border-none bg-transparent text-lg text-slate-200 placeholder:text-slate-500 focus:ring-0 focus:outline-none max-h-[200px] overflow-y-auto"
                        />
                    </div>

                    {/* Bottom: Toolbar */}
                    <div className="flex items-center justify-between px-3 pb-3">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full h-9 w-9 shrink-0"
                                title="Attach file"
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>

                            <NodeSelector className="bg-slate-800/50 border-slate-700/50 text-slate-300" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "h-10 w-10 rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-0"
                                )}
                                title="Send message"
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <ArrowUp className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Info matches screenshot */}
                {!currentSessionId && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-muted-foreground">Select a chat to begin.</p>
                    </div>
                )}

                <div className="mt-3 text-center">
                    <p className="text-xs text-slate-500">
                        Press <span className="font-medium text-slate-400">Enter</span> to send, <span className="font-medium text-slate-400">Shift + Enter</span> for new line
                    </p>
                </div>
            </div>
        </div>
    );
}
