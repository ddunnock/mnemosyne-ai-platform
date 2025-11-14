/**
 * Plugin Settings Interface
 * All configuration for the AI Agent Platform
 */

import { PersonaConfig } from './Agent';

export interface PluginSettings {
    // Provider Settings
    providers: ProviderConfig[];

    // Agent Settings
    agents: AgentConfig[];

    // RAG Settings
    rag: RAGConfig;

    // MCP Settings
    mcp: MCPConfig;

    // Persona Settings
    persona: PersonaConfig;

    // Conversation Settings
    conversation: ConversationConfig;
}

export interface ProviderConfig {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'local';
    apiKey?: string;  // Encrypted
    endpoint?: string;  // For local providers
    model?: string;
    enabled: boolean;
    lastValidated?: number;
}

export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    providerId?: string;  // Override default provider
    modelName?: string;   // Override default model
    isBackend: boolean;   // true = cannot be deleted
    enabled: boolean;

    // RAG Configuration
    ragEnabled: boolean;
    ragTopK?: number;
    ragThreshold?: number;
    ragMetadataFilters?: Record<string, any>;

    // Skill tags for orchestrator
    skillTags?: string[];

    // Routing metrics
    routingSuccessRate?: number;
    routingOverrideRate?: number;

    // MCP Tool Permissions
    mcpToolPermissions?: string[];
}

export interface RAGConfig {
    enabled: boolean;
    backend: 'sqlite' | 'indexeddb' | 'json' | 'auto';  // 'auto' for platform detection
    embeddingProvider: 'openai' | 'local';  // local = Transformers.js

    // Indexing settings
    autoIndex: boolean;
    folderFilters?: string[];  // Include only these folders
    tagFilters?: string[];     // Include only notes with these tags
    excludePatterns?: string[];

    // Search settings
    defaultTopK: number;
    defaultThreshold: number;
    hybridSearchEnabled: boolean;

    // Conversation memory
    indexConversations: boolean;

    // Progress tracking
    lastIndexTime?: number;
    totalIndexedFiles?: number;
}

export interface MCPConfig {
    enabled: boolean;
    readOnly: boolean;

    // Tool categories
    readToolsEnabled: boolean;
    searchToolsEnabled: boolean;
    writeToolsEnabled: boolean;
    metadataToolsEnabled: boolean;

    // Safety settings
    requireConfirmation: boolean;
    folderRestrictions?: string[];  // Limit operations to these folders

    // Audit logging
    auditLogEnabled: boolean;
    auditLogPath?: string;
}

export interface ConversationConfig {
    // Storage settings
    maxConversations: number;
    autoArchiveDays: number;  // Archive after N days inactive

    // Context management
    maxMessagesBeforeCompression: number;
    compressionStrategy: 'summarize' | 'truncate' | 'sliding-window';
    preserveSystemMessages: boolean;

    // Display settings
    showTimestamps: boolean;
    showTokenCounts: boolean;
    showSourceCitations: boolean;
}

export interface SecurityConfig {
    masterPasswordSet: boolean;
    encryptionVersion: string;
    keyDerivationIterations: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    providers: [],
    agents: [],
    rag: {
        enabled: false,
        backend: 'auto',
        embeddingProvider: 'openai',
        autoIndex: false,
        defaultTopK: 5,
        defaultThreshold: 0.7,
        hybridSearchEnabled: true,
        indexConversations: true,
    },
    mcp: {
        enabled: false,
        readOnly: true,
        readToolsEnabled: true,
        searchToolsEnabled: true,
        writeToolsEnabled: false,
        metadataToolsEnabled: false,
        requireConfirmation: true,
        auditLogEnabled: true,
    },
    persona: {
        enabled: false,
        intensity: 'subtle',
    },
    conversation: {
        maxConversations: 100,
        autoArchiveDays: 30,
        maxMessagesBeforeCompression: 50,
        compressionStrategy: 'summarize',
        preserveSystemMessages: true,
        showTimestamps: true,
        showTokenCounts: false,
        showSourceCitations: true,
    },
};
