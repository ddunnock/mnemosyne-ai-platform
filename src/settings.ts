import { PersonaConfig, PersonaIntensity } from './types';

export interface LLMProviderConfig {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'local' | 'custom';
    apiKey?: string;
    baseURL?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    enabled: boolean;
}

export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    llmProviderId: string;
    retrievalSettings: {
        enabled: boolean;
        topK: number;
        scoreThreshold: number;
        searchStrategy: 'semantic' | 'keyword' | 'hybrid';
    };
    mcpTools?: {
        enabled: boolean;
        allowedTools: string[];
        readOnly: boolean;
    };
    metadataFilters?: {
        folders?: string[];
        tags?: string[];
    };
    isBackend: boolean;
    canDelete: boolean;
}

export interface PluginSettings {
    // LLM Providers
    llmProviders: LLMProviderConfig[];
    defaultProviderId?: string;

    // Agents
    agents: AgentConfig[];
    defaultAgentId?: string;

    // RAG Settings
    vectorStore: {
        backend: 'json' | 'sqlite' | 'postgres';
        embeddingProvider: 'openai' | 'local';
        indexedFolders: string[];
        excludedFolders: string[];
    };

    // MCP Settings
    mcp: {
        enabled: boolean;
        defaultReadOnly: boolean;
        allowedTools: string[];
        requireConfirmation: boolean;
        auditLog: boolean;
    };

    // Security
    masterPasswordHash?: string;
    encryptedKeys: Record<string, string>;

    // UI Settings
    inlineAI: {
        enabled: boolean;
        autoComplete: boolean;
        completionDelay: number;
        showSelectionToolbar: boolean;
    };

    // Chat Settings
    chat: {
        streamingEnabled: boolean;
        showSources: boolean;
        showToolExecutions: boolean;
        maxHistoryMessages: number;
    };

    // Mnemosyne Persona Settings
    persona: PersonaConfig;

    // Advanced Settings
    advanced: {
        debug: boolean;
        logLevel: 'debug' | 'info' | 'warn' | 'error';
        maxConcurrentRequests: number;
    };
}

export const DEFAULT_SETTINGS: PluginSettings = {
    llmProviders: [],
    agents: [],

    vectorStore: {
        backend: 'json',
        embeddingProvider: 'openai',
        indexedFolders: ['/'],
        excludedFolders: []
    },

    mcp: {
        enabled: false,
        defaultReadOnly: true,
        allowedTools: [],
        requireConfirmation: true,
        auditLog: true
    },

    encryptedKeys: {},

    inlineAI: {
        enabled: false,
        autoComplete: false,
        completionDelay: 500,
        showSelectionToolbar: true
    },

    chat: {
        streamingEnabled: true,
        showSources: true,
        showToolExecutions: true,
        maxHistoryMessages: 50
    },

    persona: {
        enabled: false,
        intensity: 'moderate'
    },

    advanced: {
        debug: false,
        logLevel: 'info',
        maxConcurrentRequests: 3
    }
};