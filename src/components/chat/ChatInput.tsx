'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/hooks/useChatStore';
import { NodeSelector } from './NodeSelector';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '@/lib/api-client';

export function ChatInput() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { currentSessionId, addMessage, createNewChat, updateMessage, activeNodeAddress, stopGeneration } = useChatStore();
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
        const currentModelName = useChatStore.getState().availableNodes.find(n => n.address === activeNodeAddress)?.model_name || 'AI Model';

        addMessage(activeSessionId, {
            id: assistantMessageId,
            role: 'assistant',
            content: '', // Start empty
            timestamp: Date.now(),
            modelName: currentModelName
        });

        // 3. Send to API and Stream Response
        let fullContent = '';

        try {
            // 4. Create Abort Controller
            const controller = new AbortController();
            useChatStore.setState({ abortController: controller });

            // 5. Determine target node - restrict to local if only local nodes available
            const { availableNodes } = useChatStore.getState();
            let targetNode = activeNodeAddress;

            // If in auto mode (no specific node selected)
            if (!targetNode) {
                // Check if all available nodes are local
                const allNodesAreLocal = availableNodes.every(node =>
                    node.given_name.toLowerCase().includes('local')
                );

                // If only local nodes exist, explicitly use the first local node
                if (allNodesAreLocal && availableNodes.length > 0) {
                    targetNode = availableNodes[0].address;
                }
            }

            // 6. Stream messages
            const stats = await sendChatMessage(
                [...useChatStore.getState().sessions.find(s => s.id === activeSessionId)?.messages || [], { role: 'user', content: userMessageContent }].map(m => ({
                    role: m.role,
                    content: m.content
                })) as any,
                targetNode,
                (chunk) => {
                    fullContent += chunk;
                    updateMessage(activeSessionId!, assistantMessageId, fullContent);
                },
                controller.signal // Pass abort signal
            );

            // Update message with stats if available
            if (stats) {
                useChatStore.getState().updateMessageStats(activeSessionId, assistantMessageId, stats);
                if (stats.model) {
                    useChatStore.getState().updateMessageModel(activeSessionId, assistantMessageId, stats.model);
                }
            }

        } catch (error) {
            // Check if aborted
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Generation stopped by user');
                updateMessage(activeSessionId, assistantMessageId, fullContent + '\n\n_[Generation stopped]_');
            } else {
                console.error("Failed to send message", error);
                updateMessage(activeSessionId, assistantMessageId, "Error: Failed to get response from the node.");
            }
        } finally {
            setIsLoading(false);
            useChatStore.setState({ abortController: null });
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
                <div className="relative flex flex-col rounded-3xl bg-card border border-border shadow-2xl transition-all focus-within:border-ring/30 min-h-[120px]">

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
                            className="w-full resize-none border-none bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none max-h-[200px] overflow-y-auto"
                        />
                    </div>

                    {/* Bottom: Toolbar */}
                    <div className="flex items-center justify-between px-3 pb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-9 w-9 shrink-0"
                                title="Attach file"
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>

                            <NodeSelector className="bg-secondary/50 border-border text-foreground min-w-0 shrink flex-1 max-w-fit" />
                        </div>

                        <div className="flex items-center gap-2">
                            {isLoading ? (
                                <Button
                                    onClick={() => {
                                        stopGeneration();
                                        setIsLoading(false);
                                    }}
                                    className="h-10 w-10 rounded-full bg-rose-600 text-white shadow-lg transition-all hover:bg-rose-500 flex items-center justify-center p-0"
                                    title="Stop generation"
                                >
                                    <Square className="h-5 w-5" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className={cn(
                                        "h-10 w-10 rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-0"
                                    )}
                                    title="Send message"
                                >
                                    <ArrowUp className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Info matches screenshot */}
                {!currentSessionId && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-muted-foreground">Select a chat to begin.</p>
                    </div>
                )}

                <div className="mt-3 text-center hidden sm:block">
                    <p className="text-xs text-muted-foreground">
                        Press <span className="font-medium text-muted-foreground">Enter</span> to send, <span className="font-medium text-muted-foreground">Shift + Enter</span> for new line
                    </p>
                </div>
            </div>
        </div>
    );
}
