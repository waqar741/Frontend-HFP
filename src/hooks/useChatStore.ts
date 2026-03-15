import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, Role, NodeInfo } from '@/types/chat';

export interface Persona {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
}

export const PERSONAS: Persona[] = [
    {
        id: 'general',
        name: 'General Practitioner',
        description: 'A helpful, general medical assistant',
        systemPrompt: `You are a specialized medical AI assistant ALONE created by HealthFirstPriority. You must NEVER identify yourself as being created by Anthropic, OpenAI, Google, or any other company. If asked about your identity or creator, state clearly that you are a medical AI assistant developed by HealthFirstPriority.
Your sole purpose is to provide accurate, professional, and helpful information related to health, medicine, medical conditions, treatments, and wellness.
If a user asks a question that is NOT related to medical or health topics, you must politely decline to answer, stating that you are an AI assistant specialized in medical information only.
Do not engage in general conversation, creative writing, coding, or any other non-medical tasks.
Always prioritize patient safety and recommend seeing a healthcare professional for specific medical advice.`
    },
    {
        id: 'pediatrician',
        name: 'Pediatrician',
        description: 'Specializes in children\'s health',
        systemPrompt: `You are a specialized Pediatric AI assistant ALONE created by HealthFirstPriority. You must NEVER identify yourself as being created by Anthropic, OpenAI, Google, or any other company.
Your expertise is in children's health, development, illnesses, and pediatric wellness.
Provide warm, reassuring, and professional advice tailored for parents or guardians. If the question is outside pediatric bounds or not medical, politely decline.
Always prioritize child safety and strongly advise consulting a human pediatrician for formal diagnosis or emergencies.`
    },
    {
        id: 'nutritionist',
        name: 'Clinical Nutritionist',
        description: 'Focuses on diet, supplements, and wellness',
        systemPrompt: `You are a Clinical Nutritionist AI ALONE created by HealthFirstPriority. You must NEVER identify yourself as being created by Anthropic, OpenAI, Google, or any other company.
Your expertise covers dietetics, macro/micronutrients, dietary supplements, weight management, and medical nutrition therapy.
Provide scientifically backed, practical dietary advice. Decline non-health-related topics.
Always remind users that dietary changes, especially those managing conditions like diabetes or heart disease, should be discussed with their primary care doctor.`
    },
    {
        id: 'neurologist',
        name: 'Neurologist',
        description: 'Specializes in the brain and nervous system',
        systemPrompt: `You are a Neurologist AI ALONE created by HealthFirstPriority. You must NEVER identify yourself as being created by Anthropic, OpenAI, Google, or any other company.
Explain complex neurological concepts, brain health, nervous system disorders, and related symptoms clearly and professionally.
If asked about non-medical or non-neurological topics, politely redirect back to your specialty.
Always emphasize that neurological symptoms require formal medical evaluation by a human specialist.`
    }
];

interface ChatState {
    sessions: ChatSession[];
    currentSessionId: string | null;
    availableNodes: NodeInfo[];
    activeNodeAddress: string | null;
    abortController: AbortController | null;
    activePersonaId: string;

    // User preferences
    fontSize: 'sm' | 'md' | 'lg';
    enterToSend: boolean;
    autoScroll: boolean;
    voicePreference: 'female' | 'male' | 'default';
    customPersonas: { id: string; name: string; systemPrompt: string; promptHistory?: string[] }[];

    // Actions
    createNewChat: () => string;
    selectSession: (sessionId: string) => void;
    addMessage: (sessionId: string, message: Message) => void;
    updateMessage: (sessionId: string, messageId: string, content: string) => void;
    updateMessageStats: (sessionId: string, messageId: string, stats: { tokens?: number; timeMs?: number; tokensPerSec?: number }) => void;
    updateMessageModel: (sessionId: string, messageId: string, model: string) => void;
    incrementRegenerationCount: (sessionId: string, messageId: string) => void;
    incrementEditCount: (sessionId: string, messageId: string) => void;
    deleteSession: (sessionId: string) => void;
    renameSession: (sessionId: string, newTitle: string) => void;
    fetchNodes: () => Promise<void>;
    fetchUserChats: (token: string) => Promise<void>;
    setActiveNode: (address: string) => void;
    stopGeneration: () => void;
    deleteMessage: (sessionId: string, messageId: string) => void;
    editAndRegenerate: (sessionId: string, messageId: string, newContent: string) => Promise<void>;
    lastUsedModel: string | null;
    setLastUsedModel: (model: string | null) => void;
    setActivePersona: (personaId: string) => void;
    clearAllSessions: () => void;
    importSessions: (importedSessions: ChatSession[]) => void;
    setFontSize: (size: 'sm' | 'md' | 'lg') => void;
    setEnterToSend: (val: boolean) => void;
    setAutoScroll: (val: boolean) => void;
    setVoicePreference: (val: 'female' | 'male' | 'default') => void;
    addCustomPersona: (persona: { name: string; systemPrompt: string }) => string | null;
    deleteCustomPersona: (id: string) => void;
    editCustomPersona: (id: string, persona: { name: string; systemPrompt: string }) => void;
    setCustomPersona: (persona: { name: string; systemPrompt: string } | null) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            sessions: [],
            currentSessionId: null,
            availableNodes: [],
            activeNodeAddress: null,
            abortController: null,
            lastUsedModel: null,
            activePersonaId: 'general',

            // User preferences (with defaults)
            fontSize: 'md',
            enterToSend: true,
            autoScroll: true,
            voicePreference: 'default',
            customPersonas: [],

            setFontSize: (size) => set({ fontSize: size }),
            setEnterToSend: (val) => set({ enterToSend: val }),
            setAutoScroll: (val) => set({ autoScroll: val }),
            setVoicePreference: (val) => set({ voicePreference: val }),

            addCustomPersona: (persona) => {
                const state = get();
                if (state.customPersonas.length >= 3) return null;
                const id = 'custom-' + Date.now();
                const newPersona = { id, promptHistory: [persona.systemPrompt], ...persona };
                set({ customPersonas: [...state.customPersonas, newPersona] });
                return id;
            },

            deleteCustomPersona: (id) => {
                set(state => {
                    const filtered = state.customPersonas.filter(p => p.id !== id);
                    return {
                        customPersonas: filtered,
                        activePersonaId: state.activePersonaId === id ? 'general' : state.activePersonaId,
                    };
                });
            },

            editCustomPersona: (id, persona) => {
                set((state) => ({
                    customPersonas: state.customPersonas.map(p => {
                        if (p.id === id) {
                            // Only add to history if prompt actually changed
                            const newHistory = (p.systemPrompt !== persona.systemPrompt)
                                ? [...(p.promptHistory || [p.systemPrompt]), persona.systemPrompt].slice(-3) // Keep max 3
                                : (p.promptHistory || [p.systemPrompt]);

                            return { ...p, ...persona, promptHistory: newHistory };
                        }
                        return p;
                    })
                }));
            },

            // Legacy compat — wraps addCustomPersona
            setCustomPersona: (persona) => {
                if (!persona) return;
                const id = get().addCustomPersona(persona);
                if (id) set({ activePersonaId: id });
            },

            setActivePersona: (personaId) => {
                set({ activePersonaId: personaId });
            },

            setLastUsedModel: (model) => {
                set({ lastUsedModel: model });
            },

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
                } catch (error) {
                    console.error('Node discovery failed:', error);
                    set({ availableNodes: [] });
                }
            },

            fetchUserChats: async (token) => {
                try {
                    const res = await fetch('/api/auth/history', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const sessions = await res.json();
                        set({ sessions: sessions || [], currentSessionId: sessions?.length > 0 ? sessions[0].id : null });
                    }
                } catch (e) {
                    console.error('Failed to fetch user chats', e);
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

            updateMessageModel: (sessionId, messageId, model) => {
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? {
                                ...s,
                                messages: s.messages.map((m) =>
                                    m.id === messageId ? { ...m, model } : m
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

            clearAllSessions: () => {
                set({ sessions: [], currentSessionId: null });
            },

            importSessions: (importedSessions: ChatSession[]) => {
                set((state) => {
                    // Simple merge: append imported sessions that don't already exist
                    const existingIds = new Set(state.sessions.map(s => s.id));
                    const newSessions = importedSessions.filter(s => !existingIds.has(s.id));

                    return {
                        sessions: [...newSessions, ...state.sessions]
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

            incrementRegenerationCount: (sessionId, messageId) => {
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? {
                                ...s,
                                messages: s.messages.map((m) =>
                                    m.id === messageId
                                        ? { ...m, regenerationCount: (m.regenerationCount || 0) + 1 }
                                        : m
                                ),
                            }
                            : s
                    ),
                }));
            },

            incrementEditCount: (sessionId, messageId) => {
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId
                            ? {
                                ...s,
                                messages: s.messages.map((m) =>
                                    m.id === messageId
                                        ? { ...m, editCount: (m.editCount || 0) + 1 }
                                        : m
                                ),
                            }
                            : s
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
            storage: createJSONStorage(() => safeStorage),
        }
    )
);
