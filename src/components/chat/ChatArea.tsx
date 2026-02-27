'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { ChatMessage } from './ChatMessage';
import { sendChatMessage, Message } from '@/lib/api-client';
import { v4 as uuidv4 } from 'uuid';
import { PERSONAS } from '@/hooks/useChatStore';

export function ChatArea() {
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
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome to HealthFirstPriority</h2>
                    <p className="text-muted-foreground">
                        Upload your health records or ask any medical question to get started.
                    </p>
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
