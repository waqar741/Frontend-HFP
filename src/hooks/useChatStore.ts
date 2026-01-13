import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, Role, NodeInfo } from '@/types/chat';

interface ChatState {
    sessions: ChatSession[];
    currentSessionId: string | null;
    availableNodes: NodeInfo[];
    activeNodeAddress: string | null;
    abortController: AbortController | null;

    // Actions
    createNewChat: () => string;
    selectSession: (sessionId: string) => void;
    addMessage: (sessionId: string, message: Message) => void;
    updateMessage: (sessionId: string, messageId: string, content: string) => void;
    updateMessageStats: (sessionId: string, messageId: string, stats: { tokens?: number; timeMs?: number; tokensPerSec?: number }) => void;
    deleteSession: (sessionId: string) => void;
    renameSession: (sessionId: string, newTitle: string) => void;
    fetchNodes: () => Promise<void>;
    setActiveNode: (address: string) => void;
    stopGeneration: () => void;
    deleteMessage: (sessionId: string, messageId: string) => void;
    editAndRegenerate: (sessionId: string, messageId: string, newContent: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            sessions: [],
            currentSessionId: null,
            availableNodes: [],
            activeNodeAddress: null,
            abortController: null,

            fetchNodes: async () => {
                try {
                    const res = await fetch('/api/nodes');
                    if (!res.ok) throw new Error('Failed to fetch nodes');

                    const nodes: NodeInfo[] = await res.json();

                    // Filter: status=online AND model_status='Healthy'
                    const validNodes = nodes.filter(node =>
                        node.status.toLowerCase() === 'online' &&
                        node.model_status === 'Healthy'
                    );

                    set({ availableNodes: validNodes });

                    // If no active node selected, or current selection is invalid, select first available
                    const state = get();
                    if (validNodes.length > 0 && !state.activeNodeAddress) {
                        set({ activeNodeAddress: validNodes[0].address });
                    }
                } catch (error) {
                    console.error('Node discovery failed:', error);
                    set({ availableNodes: [] });
                }
            },

            setActiveNode: (address) => {
                set({ activeNodeAddress: address });
            },

            createNewChat: () => {
                const state = get();
                // If there's already an empty session at the top, reuse it
                if (state.sessions.length > 0 && state.sessions[0].messages.length === 0) {
                    set({ currentSessionId: state.sessions[0].id });
                    return state.sessions[0].id;
                }

                const newSession: ChatSession = {
                    id: uuidv4(),
                    title: 'New Consultation',
                    messages: [],
                    timestamp: Date.now(),
                };

                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    currentSessionId: newSession.id,
                }));

                return newSession.id;
            },

            selectSession: (sessionId) => {
                set({ currentSessionId: sessionId });
            },

            addMessage: (sessionId, message) => {
                set((state) => {
                    const sessionIndex = state.sessions.findIndex((s) => s.id === sessionId);
                    if (sessionIndex === -1) return state;

                    const updatedSessions = [...state.sessions];
                    updatedSessions[sessionIndex] = {
                        ...updatedSessions[sessionIndex],
                        messages: [...updatedSessions[sessionIndex].messages, message],

                        // Auto-update title based on first user message if title is default
                        title:
                            updatedSessions[sessionIndex].title === 'New Consultation' && message.role === 'user'
                                ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
                                : updatedSessions[sessionIndex].title,

                        timestamp: Date.now(),
                    };

                    return { sessions: updatedSessions };
                });
            },

            updateMessage: (sessionId, messageId, content) => {
                set((state) => {
                    const sessionIndex = state.sessions.findIndex((s) => s.id === sessionId);
                    if (sessionIndex === -1) return state;

                    const updatedSessions = [...state.sessions];
                    const session = updatedSessions[sessionIndex];

                    const messageIndex = session.messages.findIndex((m) => m.id === messageId);
                    if (messageIndex === -1) return state;

                    const updatedMessages = [...session.messages];
                    updatedMessages[messageIndex] = {
                        ...updatedMessages[messageIndex],
                        content: content
                    };

                    updatedSessions[sessionIndex] = {
                        ...session,
                        messages: updatedMessages,
                        timestamp: Date.now()
                    };

                    return { sessions: updatedSessions };
                });
            },

            updateMessageStats: (sessionId, messageId, stats) => {
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? {
                                ...s,
                                messages: s.messages.map((m) =>
                                    m.id === messageId ? { ...m, stats } : m
                                ),
                            }
                            : s
                    ),
                }));
            },

            deleteSession: (sessionId) => {
                set((state) => {
                    const newSessions = state.sessions.filter((s) => s.id !== sessionId);
                    // If current session is deleted, select the first available remaining session, or null
                    const nextSessionId =
                        state.currentSessionId === sessionId
                            ? (newSessions.length > 0 ? newSessions[0].id : null)
                            : state.currentSessionId;

                    return {
                        sessions: newSessions,
                        currentSessionId: nextSessionId
                    };
                });
            },

            renameSession: (sessionId, newTitle) => {
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId ? { ...s, title: newTitle } : s
                    ),
                }));
            },

            deleteMessage: (sessionId, messageId) => {
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? { ...s, messages: s.messages.filter((m) => m.id !== messageId) }
                            : s
                    ),
                }));
            },

            editAndRegenerate: async (sessionId, messageId, newContent) => {
                const state = get();
                const session = state.sessions.find((s) => s.id === sessionId);
                if (!session) return;

                // Find the message index
                const messageIndex = session.messages.findIndex((m) => m.id === messageId);
                if (messageIndex === -1) return;

                // Update the message content
                const updatedMessages = [...session.messages];
                updatedMessages[messageIndex] = {
                    ...updatedMessages[messageIndex],
                    content: newContent,
                };

                // Truncate conversation at this point (remove all messages after this one)
                const truncatedMessages = updatedMessages.slice(0, messageIndex + 1);

                // Update session with truncated messages
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? { ...s, messages: truncatedMessages }
                            : s
                    ),
                }));

                // Note: The regeneration will need to be triggered from the component
                // that calls this, as it requires UI state (loading, etc.)
            },

            stopGeneration: () => {
                const { abortController } = get();
                if (abortController) {
                    abortController.abort();
                    set({ abortController: null });
                }
            },
        }),
        {
            name: 'hfp-secure-storage',
        }
    )
);
