'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore, PERSONAS } from '@/hooks/useChatStore';
import { NodeSelector } from './NodeSelector';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '@/lib/api-client';

export function ChatInput() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { currentSessionId, addMessage, createNewChat, updateMessage, activeNodeAddress, stopGeneration, activePersonaId } = useChatStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const activePersona = PERSONAS.find(p => p.id === activePersonaId) || PERSONAS[0];

    // Auto-resize textarea - matching Web-UI behavior
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '1rem';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = scrollHeight + 'px';
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim()) return;

        let activeSessionId = currentSessionId;

        if (!activeSessionId) {
            activeSessionId = createNewChat();
        }

        const userMessageContent = input;
        setInput('');
        setIsLoading(true);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = '1rem';
        }

        addMessage(activeSessionId, {
            id: uuidv4(),
            role: 'user',
            content: userMessageContent,
            timestamp: Date.now()
        });

        const assistantMessageId = uuidv4();
        const currentModelName = useChatStore.getState().availableNodes.find(n => n.address === activeNodeAddress)?.model_name || 'AI Model';

        addMessage(activeSessionId, {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            modelName: currentModelName
        });

        let fullContent = '';

        try {
            const controller = new AbortController();
            useChatStore.setState({ abortController: controller });

            const { availableNodes } = useChatStore.getState();
            let targetNode = activeNodeAddress;

            if (!targetNode) {
                const remoteNodes = availableNodes.filter(node =>
                    !node.given_name.toLowerCase().includes('local')
                );
                const localNodes = availableNodes.filter(node =>
                    node.given_name.toLowerCase().includes('local')
                );

                if (remoteNodes.length > 0) {
                    targetNode = remoteNodes[0].address;
                } else if (localNodes.length > 0) {
                    targetNode = localNodes[0].address;
                }
            }


            const stats = await sendChatMessage(
                [...useChatStore.getState().sessions.find(s => s.id === activeSessionId)?.messages || [], { role: 'user', content: userMessageContent }]
                    .map(m => ({ role: m.role, content: m.content }))
                    .filter(m => {
                        // Filter out empty, error, and stopped messages
                        if (!m.content || !m.content.trim()) return false;
                        if (m.content.startsWith('Error:')) return false;
                        if (m.content.includes('_[Generation stopped]_')) return false;
                        if (m.content.trim() === 'None') return false;
                        return true;
                    }) as any,
                targetNode,
                { role: 'system', content: activePersona.systemPrompt },
                (chunk) => {
                    fullContent += chunk;
                    updateMessage(activeSessionId!, assistantMessageId, fullContent);
                },
                controller.signal
            );

            if (stats) {
                useChatStore.getState().updateMessageStats(activeSessionId, assistantMessageId, stats);
                if (stats.model) {
                    useChatStore.getState().updateMessageModel(activeSessionId, assistantMessageId, stats.model);
                }
            }

        } catch (error) {
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
            if (!input.trim() || isLoading) return;
            handleSend();
        }
    };

    return (
        <div className="mx-auto w-full max-w-[48rem] px-3 pb-2 sm:px-4 sm:pb-3">
            {/* Form container with glowing border effect */}
            <div
                className="bg-muted/70 dark:bg-muted/85 border border-primary/20 dark:border-primary/25 focus-within:border-primary/40 dark:focus-within:border-primary/50 rounded-3xl overflow-hidden text-foreground outline-none transition-all duration-300"
            >
                {/* Textarea area */}
                <div className="relative min-h-[56px] px-5 py-4">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        disabled={isLoading}
                        rows={1}
                        className="text-md max-h-40 min-h-14 w-full resize-none border-0 bg-transparent p-0 leading-7 outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                    />

                    {/* Actions row - matching Web-UI: flex w-full items-center gap-3 */}
                    <div className="flex w-full items-center gap-3">
                        {/* File attachment - left */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mr-auto text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-8 w-8 shrink-0"
                            title="Attach file"
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>

                        {/* Model selector - center, matching Web-UI position */}
                        <NodeSelector />

                        {/* Send/Stop button - right */}
                        {isLoading ? (
                            <Button
                                type="button"
                                onClick={() => {
                                    stopGeneration();
                                    setIsLoading(false);
                                }}
                                className="h-8 w-8 bg-transparent p-0 hover:bg-destructive/20"
                                title="Stop"
                            >
                                <span className="sr-only">Stop</span>
                                <Square className="h-8 w-8 fill-destructive stroke-destructive" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="h-8 w-8 rounded-full p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Send message"
                            >
                                <ArrowUp className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Helper text - subtle like Web-UI */}
            <div className="mt-1.5 text-center hidden sm:block">
                <p className="text-xs text-muted-foreground/60">
                    <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border/50 font-mono">Enter</kbd> to send
                    <span className="mx-2">·</span>
                    <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border/50 font-mono">Shift + Enter</kbd> for new line
                </p>
            </div>
        </div>
    );
}
