export type Role = 'user' | 'assistant' | 'system';

export interface Message {
    id: string;
    role: Role;
    content: string;
    timestamp: number;
    stats?: {
        tokens?: number;
        timeMs?: number;
        tokensPerSec?: number;
    };
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

export interface NodeInfo {
    given_name: string;
    address: string;
    status: string;
    model_name: string;
    model_status: string;
}
