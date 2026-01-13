'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/hooks/useChatStore';
import { NodeSelector } from './NodeSelector';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '@/lib/api-client';

export function ChatInput() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { currentSessionId, addMessage, createNewChat, updateMessage, activeNodeAddress } = useChatStore();
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

        // 1. Add User Message
        addMessage(activeSessionId, {
            id: uuidv4(),
            role: 'user',
            content: userMessageContent,
            timestamp: Date.now()
        });

        // 2. Add Placeholder Assistant Message
        const assistantMessageId = uuidv4();
        addMessage(activeSessionId, {
            id: assistantMessageId,
            role: 'assistant',
            content: '', // Start empty
            timestamp: Date.now()
        });

        try {
            // 3. Send to API and Stream Response
            let fullContent = '';

            await sendChatMessage(
                [...useChatStore.getState().sessions.find(s => s.id === activeSessionId)?.messages || [], { role: 'user', content: userMessageContent }] as any, // Construct history if needed, or api-client handles it? 
                // Wait, api-client expects just the new message array? Or full history?
                // Usually full history. I'll simplify and just send context if needed, but for now sendChatMessage expects Message[].
                // Let's grab the session messages from store + the new user message.
                activeNodeAddress,
                (chunk) => {
                    fullContent += chunk;
                    updateMessage(activeSessionId!, assistantMessageId, fullContent);
                }
            );

        } catch (error) {
            console.error("Failed to send message", error);
            // Optionally update message to show error
            updateMessage(activeSessionId, assistantMessageId, "Error: Failed to get response from the node.");
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
