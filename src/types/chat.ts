export type Role = 'user' | 'assistant' | 'system';

export interface MessageVersion {
    content: string;
    stats?: {
        tokens?: number;
        timeMs?: number;
        tokensPerSec?: number;
    };
    model?: string;
    modelName?: string;
    timestamp: number;
}

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
    modelName?: string;
    model?: string;
    regenerationCount?: number;
    editCount?: number;
    previousVersions?: MessageVersion[];
    activeVersionIndex?: number; // which version is being viewed (undefined = latest)
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
