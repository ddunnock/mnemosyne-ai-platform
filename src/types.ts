// Global type definitions for the AI Agent Platform

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    agentId?: string;
    sources?: DocumentReference[];
    toolExecutions?: ToolExecution[];
}

export interface Conversation {
    id: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
    agentId?: string;
    title?: string;
}

export interface DocumentReference {
    path: string;
    title: string;
    excerpt: string;
    score: number;
}

export interface ToolExecution {
    toolName: string;
    parameters: any;
    result: any;
    timestamp: number;
    success: boolean;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export interface ProviderInfo {
    id: string;
    name: string;
    type: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastChecked?: number;
}

export type PersonaIntensity = 'none' | 'subtle' | 'moderate' | 'strong';

export interface PersonaConfig {
    enabled: boolean;
    intensity: PersonaIntensity;
    customPromptAddition?: string;
}