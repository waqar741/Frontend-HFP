'use client';

import { useState, KeyboardEvent, useRef, useEffect, useCallback } from 'react';
import { Paperclip, ArrowUp, Square, BookOpen, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore, PERSONAS } from '@/hooks/useChatStore';
import { useDocumentStore } from '@/hooks/useDocumentStore';
import { NodeSelector } from './NodeSelector';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';
import { v4 as uuidv4 } from 'uuid';
import { sendChatMessage } from '@/lib/api-client';

interface ChatInputProps {
    initialPrompt?: string;
    onPromptReceived?: () => void;
}

export function ChatInput({ initialPrompt, onPromptReceived }: ChatInputProps = {}) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);

    // @mention autocomplete state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStart, setMentionStart] = useState<number>(0);
    const [mentionIndex, setMentionIndex] = useState(0);

    const { currentSessionId, addMessage, createNewChat, updateMessage, activeNodeAddress, stopGeneration, activePersonaId, enterToSend, customPersonas } = useChatStore();
    const { documents, getContextForMentions } = useDocumentStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mentionRef = useRef<HTMLDivElement>(null);

    const customMatch = customPersonas.find(p => p.id === activePersonaId);
    const activePersona = customMatch
        ? { id: customMatch.id, name: customMatch.name, description: '', systemPrompt: customMatch.systemPrompt }
        : (PERSONAS.find(p => p.id === activePersonaId) || PERSONAS[0]);

    // Load document library on mount
    useEffect(() => {
        useDocumentStore.getState().loadDocuments();
    }, []);

    // Handle initial prompt from suggestions
    useEffect(() => {
        if (initialPrompt && !isLoading) {
            setInput(initialPrompt);
            onPromptReceived?.();
        }
    }, [initialPrompt, isLoading, onPromptReceived]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '1rem';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = scrollHeight + 'px';
        }
    }, [input]);

    // Filtered docs for autocomplete
    const mentionMatches = mentionQuery !== null
        ? documents.filter(d =>
            d.processingStatus === 'ready' &&
            d.name.toLowerCase().includes(mentionQuery.toLowerCase())
        ).slice(0, 6)
        : [];

    // Parse @mentions from message text and resolve to document IDs
    const parseMentionedDocIds = useCallback((text: string): string[] => {
        const matches = text.match(/@([\w-]+)/g) || [];
        return matches
            .map(m => documents.find(d => d.name === m.slice(1))?.id)
            .filter(Boolean) as string[];
    }, [documents]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);

        // Detect @mention trigger
        const cursor = e.target.selectionStart ?? val.length;
        const before = val.slice(0, cursor);
        const atMatch = before.match(/@([\w-]*)$/);
        if (atMatch) {
            setMentionQuery(atMatch[1]);
            setMentionStart(cursor - atMatch[0].length);
            setMentionIndex(0);
        } else {
            setMentionQuery(null);
        }
    };

    const insertMention = (name: string) => {
        const cursor = textareaRef.current?.selectionStart ?? input.length;
        const before = input.slice(0, mentionStart);
        const after = input.slice(cursor);
        const newVal = `${before}@${name} ${after}`;
        setInput(newVal);
        setMentionQuery(null);
        setTimeout(() => {
            const newCursor = before.length + name.length + 2;
            textareaRef.current?.setSelectionRange(newCursor, newCursor);
            textareaRef.current?.focus();
        }, 0);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        let activeSessionId = currentSessionId;
        if (!activeSessionId) {
            activeSessionId = createNewChat();
        }

        const userMessageContent = input;
        setInput('');
        setIsLoading(true);
        setMentionQuery(null);

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
                if (remoteNodes.length > 0) targetNode = remoteNodes[0].address;
                else if (localNodes.length > 0) targetNode = localNodes[0].address;
            }

            // Resolve @mentioned document context from local IndexedDB
            let systemContent = activePersona.systemPrompt;
            const { textContext, images: docImages } = await getContextForMentions(userMessageContent);
            if (textContext) {
                systemContent = `${systemContent}\n\n[DOCUMENT CONTEXT]\n${textContext}\n[END DOCUMENT CONTEXT]`;
            }

            // Build messages array
            const rawMessages = [...(useChatStore.getState().sessions.find(s => s.id === activeSessionId)?.messages || [])]
                .map(m => ({ role: m.role, content: m.content }))
                .filter(m => {
                    if (!m.content || !m.content.trim()) return false;
                    if (m.content.startsWith('Error:')) return false;
                    if (m.content.includes('_[Generation stopped]_')) return false;
                    if (m.content.trim() === 'None') return false;
                    return true;
                });

            // If we have document images, convert the last user message to multimodal format
            let messagesForApi: any[] = rawMessages;
            if (docImages.length > 0) {
                messagesForApi = rawMessages.map((m, idx) => {
                    // Only convert the last user message to multimodal
                    if (idx === rawMessages.length - 1 && m.role === 'user') {
                        const contentParts: any[] = [
                            { type: 'text', text: m.content }
                        ];
                        for (const img of docImages) {
                            contentParts.push({
                                type: 'image_url',
                                image_url: { url: img.dataUrl }
                            });
                        }
                        return { role: m.role, content: contentParts };
                    }
                    return m;
                });
            }

            const stats = await sendChatMessage(
                messagesForApi,
                targetNode,
                { role: 'system', content: systemContent },
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
        // Handle @mention navigation
        if (mentionQuery !== null && mentionMatches.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionMatches.length - 1)); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionMatches[mentionIndex].name); return; }
            if (e.key === 'Escape') { setMentionQuery(null); return; }
        }

        if (enterToSend) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!input.trim() || isLoading) return;
                handleSend();
            }
        } else {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                if (!input.trim() || isLoading) return;
                handleSend();
            }
        }
    };

    // Highlight @mentions in ghost layer — not adding that complexity; tag rendering is enough.

    return (
        <>
            <DocumentLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />

            <div className="mx-auto w-full max-w-[48rem] px-3 pb-2 sm:px-4 sm:pb-3">
                {/* @mention autocomplete dropdown */}
                {mentionQuery !== null && mentionMatches.length > 0 && (
                    <div
                        ref={mentionRef}
                        className="mb-2 rounded-xl border border-border bg-popover shadow-xl overflow-hidden animate-fade-in-up"
                    >
                        <div className="px-3 py-1.5 border-b border-border bg-muted/30">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <AtSign className="h-3 w-3" /> Documents
                            </p>
                        </div>
                        {mentionMatches.map((doc, idx) => (
                            <button
                                key={doc.id}
                                onMouseDown={(e) => { e.preventDefault(); insertMention(doc.name); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${idx === mentionIndex ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/50 text-muted-foreground'
                                    }`}
                            >
                                <span className="font-mono text-xs text-primary font-semibold">@{doc.name}</span>
                                <span className="text-xs truncate">{doc.originalName}</span>
                                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{doc.pageCount}p</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* No-match hint */}
                {mentionQuery !== null && mentionQuery.length > 0 && mentionMatches.length === 0 && (
                    <div className="mb-2 rounded-xl border border-border bg-popover px-3 py-3 text-xs text-muted-foreground animate-fade-in-up">
                        No document matches "@{mentionQuery}". <button className="text-primary hover:underline" onClick={() => setLibraryOpen(true)}>Open library →</button>
                    </div>
                )}

                {/* Form container */}
                <div className="bg-muted/70 dark:bg-muted/85 border border-primary/20 dark:border-primary/25 focus-within:border-primary/40 dark:focus-within:border-primary/50 rounded-3xl overflow-hidden text-foreground outline-none transition-all duration-300">
                    {/* Textarea area */}
                    <div className="relative min-h-[56px] px-5 py-4">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything… type @ to reference a document"
                            disabled={isLoading}
                            rows={1}
                            className="text-md max-h-40 min-h-14 w-full resize-none border-0 bg-transparent p-0 leading-7 outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                        />

                        {/* Actions row */}
                        <div className="flex w-full items-center gap-3">
                            {/* Document Library button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLibraryOpen(true)}
                                className="mr-auto text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-8 w-8 shrink-0"
                                title="Document Library"
                            >
                                <BookOpen className="h-5 w-5" />
                            </Button>

                            {/* Node selector */}
                            <NodeSelector />

                            {/* Send/Stop */}
                            {isLoading ? (
                                <Button
                                    type="button"
                                    onClick={() => { stopGeneration(); setIsLoading(false); }}
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

                {/* Helper text */}
                <div className="mt-1.5 text-center hidden sm:block">
                    <p className="text-xs text-muted-foreground/60">
                        {enterToSend ? (
                            <>
                                <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border/50 font-mono">Enter</kbd> to send
                                <span className="mx-2">·</span>
                                <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border/50 font-mono">Shift + Enter</kbd> for new line
                            </>
                        ) : (
                            <>
                                <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border/50 font-mono">Shift + Enter</kbd> to send
                                <span className="mx-2">·</span>
                                <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border/50 font-mono">Enter</kbd> for new line
                            </>
                        )}
                        <span className="mx-2">·</span>
                        <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border border-border/50 font-mono">@</kbd> to cite a document
                    </p>
                </div>
            </div>
        </>
    );
}
