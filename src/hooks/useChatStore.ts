import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, Role } from '@/types/chat';

interface ChatState {
    sessions: ChatSession[];
    currentSessionId: string | null;

    // Actions
    createNewChat: () => void;
    selectSession: (sessionId: string) => void;
    addMessage: (sessionId: string, message: Message) => void;
    deleteSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            sessions: [],
            currentSessionId: null,

            createNewChat: () => {
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
        }),
        {
            name: 'hfp-secure-storage',
        }
    )
);
