'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { ChatMessage } from './ChatMessage';
import { sendChatMessage, Message } from '@/lib/api-client';
import { v4 as uuidv4 } from 'uuid';
import { PERSONAS } from '@/hooks/useChatStore';

interface ChatAreaProps {
    onPromptSelect?: (prompt: string) => void;
}

const SUGGESTED_PROMPTS = [
    { title: "Review Lab Results", prompt: "Can you help me understand my recent blood test results? My doctor said my LDL cholesterol is slightly high." },
    { title: "Check Interactions", prompt: "Are there any known interactions between Ibuprofen and Lisinopril?" },
    { title: "Symptom Checker", prompt: "I've been having a persistent headache for three days along with mild sensitivity to light." },
    { title: "Dietary Advice", prompt: "What are some heart-healthy breakfast options that are low in sodium and high in fiber?" }
];

export function ChatArea({ onPromptSelect }: ChatAreaProps) {
    const { currentSessionId, sessions, addMessage, updateMessage, deleteMessage, editAndRegenerate, activeNodeAddress, availableNodes, incrementRegenerationCount, incrementEditCount, activePersonaId } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activePersona = PERSONAS.find(p => p.id === activePersonaId) || PERSONAS[0];

    const currentSession = sessions.find((s) => s.id === currentSessionId);
    const messages = currentSession?.messages || [];

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleEdit = async (messageId: string, newContent: string) => {
        if (!currentSessionId) return;

        // Get current message to preserve edit count
        const session = sessions.find(s => s.id === currentSessionId);
        if (!session) return;

        const userMessage = session.messages.find(m => m.id === messageId);
        if (!userMessage) return;

        const currentEditCount = userMessage.editCount || 0;

        // Edit and truncate conversation
        await editAndRegenerate(currentSessionId, messageId, newContent);

        // Update edit count on the edited message
        incrementEditCount(currentSessionId, messageId);

        // Now trigger a regeneration - create new AI response
        const newAssistantId = uuidv4();
        const currentModelName = useChatStore.getState().availableNodes.find(n => n.address === activeNodeAddress)?.model_name || 'AI Model';

        addMessage(currentSessionId, {
            id: newAssistantId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            modelName: currentModelName
        });

        try {
            let fullContent = '';
            const controller = new AbortController();
            useChatStore.setState({ abortController: controller });

            const stats = await sendChatMessage(
                (useChatStore.getState().sessions.find(s => s.id === currentSessionId)?.messages || []).map(m => ({
                    role: m.role,
                    content: m.content
                })).filter(m => {
                    if (!m.content || !m.content.trim()) return false;
                    if (m.content.startsWith('Error:')) return false;
                    if (m.content.includes('_[Generation stopped]_')) return false;
                    if (m.content.trim() === 'None') return false;
                    return true;
                }) as any,
                activeNodeAddress,
                { role: 'system', content: activePersona.systemPrompt },
                (chunk) => {
                    fullContent += chunk;
                    updateMessage(currentSessionId, newAssistantId, fullContent);
                },
                controller.signal
            );

            // Update stats after streaming completes
            if (stats) {
                useChatStore.getState().updateMessageStats(currentSessionId, newAssistantId, stats);
                if (stats.model) {
                    useChatStore.getState().updateMessageModel(currentSessionId, newAssistantId, stats.model);
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Generation stopped');
            } else {
                console.error('Failed to send message', error);
                updateMessage(currentSessionId, newAssistantId, 'Error: Failed to get response from the node.');
            }
        } finally {
            useChatStore.setState({ abortController: null });
        }
    };

    const handleRegenerate = async (messageId: string) => {
        if (!currentSessionId) return;

        const session = sessions.find(s => s.id === currentSessionId);
        if (!session) return;

        const messageIndex = session.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || session.messages[messageIndex].role !== 'assistant') return;

        const oldMessage = session.messages[messageIndex];

        // Save current content as a previous version
        const oldVersion = {
            content: oldMessage.content,
            stats: oldMessage.stats,
            model: oldMessage.model,
            modelName: oldMessage.modelName,
            timestamp: oldMessage.timestamp,
        };

        const previousVersions = [...(oldMessage.previousVersions || []), oldVersion];

        // Update the message in-place: clear content, store versions, increment count
        updateMessage(currentSessionId, messageId, '');
        // We need a helper to set versions and clear stats on the message
        useChatStore.setState((state) => ({
            sessions: state.sessions.map(s => {
                if (s.id !== currentSessionId) return s;
                return {
                    ...s,
                    messages: s.messages.map(m => {
                        if (m.id !== messageId) return m;
                        return {
                            ...m,
                            content: '',
                            stats: undefined,
                            previousVersions,
                            activeVersionIndex: undefined, // viewing latest
                            regenerationCount: (m.regenerationCount || 0) + 1,
                            timestamp: Date.now(),
                        };
                    })
                };
            })
        }));

        try {
            let fullContent = '';
            const controller = new AbortController();
            useChatStore.setState({ abortController: controller });

            const stats = await sendChatMessage(
                (useChatStore.getState().sessions.find(s => s.id === currentSessionId)?.messages.slice(0, messageIndex) || []).map(m => ({
                    role: m.role,
                    content: m.content
                })).filter(m => {
                    if (!m.content || !m.content.trim()) return false;
                    if (m.content.startsWith('Error:')) return false;
                    if (m.content.includes('_[Generation stopped]_')) return false;
                    if (m.content.trim() === 'None') return false;
                    return true;
                }) as any,
                activeNodeAddress,
                { role: 'system', content: activePersona.systemPrompt },
                (chunk) => {
                    fullContent += chunk;
                    updateMessage(currentSessionId, messageId, fullContent);
                },
                controller.signal
            );

            if (stats) {
                useChatStore.getState().updateMessageStats(currentSessionId, messageId, stats);
                if (stats.model) {
                    useChatStore.getState().updateMessageModel(currentSessionId, messageId, stats.model);
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Generation stopped');
            } else {
                console.error('Failed to regenerate', error);
            }
        } finally {
            useChatStore.setState({ abortController: null });
        }
    };

    const handleCopy = (content: string) => {
        // Optionally show a toast notification
        console.log('Copied to clipboard');
    };

    const handleDelete = (messageId: string) => {
        if (!currentSessionId) return;
        deleteMessage(currentSessionId, messageId);
    };

    return (
        <div className="flex-1 overflow-y-auto chat-scroll-area">
            {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center max-w-3xl mx-auto animate-fade-in-up">
                    <div className="bg-primary/10 p-4 rounded-full mb-6">
                        <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-semibold mb-3 text-foreground tracking-tight">How can I help you today?</h2>
                    <p className="text-muted-foreground mb-10 max-w-lg">
                        I am your specialized medical AI assistant. I can help analyze records, check symptoms, or answer general health questions.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                        {SUGGESTED_PROMPTS.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => onPromptSelect?.(item.prompt)}
                                className="flex flex-col items-start gap-1 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent hover:border-accent-foreground/20 text-left transition-all duration-200 group"
                            >
                                <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{item.title}</span>
                                <span className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="pb-4">
                    {/* Centered container with max width */}
                    <div className="max-w-4xl mx-auto">
                        {messages.map((message, index) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                isLast={index === messages.length - 1}
                                modelName={message.modelName}
                                onEdit={message.role === 'user' ? (newContent) => handleEdit(message.id, newContent) : undefined}
                                onRegenerate={message.role === 'assistant' && index === messages.length - 1 ? () => handleRegenerate(message.id) : undefined}
                                onCopy={handleCopy}
                                onDelete={() => handleDelete(message.id)}
                            />
                        ))}
                    </div>
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
}
