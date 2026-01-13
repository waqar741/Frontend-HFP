export type Role = 'user' | 'assistant' | 'system';

export interface Message {
    role: Role;
    content: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}
