'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { ChatMessage } from './ChatMessage';
import { sendChatMessage } from '@/lib/api-client';
import { v4 as uuidv4 } from 'uuid';

export function ChatArea() {
    const { currentSessionId, sessions, addMessage, updateMessage, deleteMessage, editAndRegenerate, activeNodeAddress, availableNodes } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentSession = sessions.find((s) => s.id === currentSessionId);
    const messages = currentSession?.messages || [];

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleEdit = async (messageId: string, newContent: string) => {
        if (!currentSessionId) return;

        // Edit and truncate
        await editAndRegenerate(currentSessionId, messageId, newContent);

        // Now trigger a regeneration
        const assistantMessageId = uuidv4();
        addMessage(currentSessionId, {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        });

        try {
            let fullContent = '';
            const controller = new AbortController();
            useChatStore.setState({ abortController: controller });

            await sendChatMessage(
                useChatStore.getState().sessions.find(s => s.id === currentSessionId)?.messages as any,
                activeNodeAddress,
                (chunk) => {
                    fullContent += chunk;
                    updateMessage(currentSessionId, assistantMessageId, fullContent);
                },
                controller.signal
            );
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

    const handleRegenerate = async (messageId: string) => {
        if (!currentSessionId) return;

        // Find the message index and remove it
        const session = sessions.find(s => s.id === currentSessionId);
        if (!session) return;

        const messageIndex = session.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || session.messages[messageIndex].role !== 'assistant') return;

        // Delete the existing assistant message
        deleteMessage(currentSessionId, messageId);

        // Create a new assistant message
        const newAssistantId = uuidv4();
        addMessage(currentSessionId, {
            id: newAssistantId,
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        });

        try {
            let fullContent = '';
            const controller = new AbortController();
            useChatStore.setState({ abortController: controller });

            await sendChatMessage(
                useChatStore.getState().sessions.find(s => s.id === currentSessionId)?.messages.slice(0, messageIndex) as any,
                activeNodeAddress,
                (chunk) => {
                    fullContent += chunk;
                    updateMessage(currentSessionId, newAssistantId, fullContent);
                },
                controller.signal
            );
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
        <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome to HealthFirstPriority</h2>
                    <p className="text-muted-foreground">
                        Upload your health records or ask any medical question to get started.
                    </p>
                </div>
            ) : (
                <div className="pb-32">
                    {messages.map((message, index) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            isLast={index === messages.length - 1}
                            modelName={message.role === 'assistant' ? availableNodes.find(n => n.address === activeNodeAddress)?.model_name || 'AI Model' : undefined}
                            onEdit={message.role === 'user' ? (newContent) => handleEdit(message.id, newContent) : undefined}
                            onRegenerate={message.role === 'assistant' && index === messages.length - 1 ? () => handleRegenerate(message.id) : undefined}
                            onCopy={handleCopy}
                            onDelete={() => handleDelete(message.id)}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
}
