/**
 * Conversation and Message Types
 * Defines conversation state, message structure, and context management
 */

import { Message, TokenUsage } from './Provider';
import { RAGContext } from './Agent';

export interface Conversation {
    id: string;
    title?: string;
    agentId?: string;  // Primary agent for this conversation
    messages: ConversationMessage[];

    // Timestamps
    createdAt: number;
    updatedAt: number;
    lastActiveAt: number;

    // Context management
    contextState: ContextState;

    // Metadata
    archived: boolean;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface ConversationMessage extends Message {
    id: string;
    timestamp: number;
    agentId?: string;
    agentName?: string;

    // RAG sources
    sources?: SourceCitation[];

    // Tool executions
    toolExecutions?: ToolExecution[];

    // Token usage
    usage?: TokenUsage;

    // Message metadata
    metadata?: MessageMetadata;
}

export interface SourceCitation {
    filePath: string;
    title: string;
    excerpt: string;
    score: number;
    lineNumbers?: [number, number];  // Start and end line
    metadata?: Record<string, any>;
}

export interface ToolExecution {
    toolName: string;
    parameters: Record<string, any>;
    result: any;
    timestamp: number;
    success: boolean;
    error?: string;
    confirmationRequired?: boolean;
    userConfirmed?: boolean;
}

export interface MessageMetadata {
    model?: string;
    temperature?: number;
    responseTimeMs?: number;
    retryCount?: number;
    edited?: boolean;
    editedAt?: number;
}

export interface ContextState {
    totalMessages: number;
    totalTokens: number;
    estimatedContextTokens: number;

    // Compression state
    compressionTriggered: boolean;
    lastCompressionAt?: number;
    messagesBeforeCompression?: number;
    compressionStrategy?: CompressionStrategy;

    // Context window tracking
    maxContextTokens: number;
    messagesUntilCompression: number;
    tokenPercentageUsed: number;
}

export type CompressionStrategy = 'summarize' | 'truncate' | 'sliding-window';

export interface CompressionConfig {
    strategy: CompressionStrategy;
    targetTokens: number;
    preserveSystemMessages: boolean;
    preserveRecentMessages: number;
    summarizationPrompt?: string;
}

export interface CompressionResult {
    originalMessageCount: number;
    compressedMessageCount: number;
    originalTokenCount: number;
    compressedTokenCount: number;
    summary?: string;
    preservedMessageIds: string[];
    removedMessageIds: string[];
    timestamp: number;
}

export interface ConversationSummary {
    conversationId: string;
    title: string;
    summary: string;
    keyTopics: string[];
    agentIds: string[];
    messageCount: number;
    startDate: number;
    endDate: number;
    lastActive: number;
}

export interface ConversationFilter {
    archived?: boolean;
    agentId?: string;
    tags?: string[];
    dateRange?: {
        start: number;
        end: number;
    };
    searchQuery?: string;
    lastActiveBefore?: number;
    lastActiveAfter?: number;
}

export interface ConversationListItem {
    id: string;
    title: string;
    preview: string;  // First user message or summary
    agentName?: string;
    lastActiveAt: number;
    messageCount: number;
    archived: boolean;
    unread?: boolean;
}

// Conversation management events
export type ConversationEvent =
    | { type: 'conversation_created'; conversation: Conversation }
    | { type: 'conversation_updated'; conversation: Conversation }
    | { type: 'conversation_archived'; conversationId: string }
    | { type: 'conversation_deleted'; conversationId: string }
    | { type: 'message_added'; conversationId: string; message: ConversationMessage }
    | { type: 'message_updated'; conversationId: string; message: ConversationMessage }
    | { type: 'message_deleted'; conversationId: string; messageId: string }
    | { type: 'compression_triggered'; conversationId: string; result: CompressionResult };

// Conversation state machine
export enum ConversationStatus {
    ACTIVE = 'active',
    IDLE = 'idle',
    ARCHIVED = 'archived',
    PROCESSING = 'processing',
    ERROR = 'error',
}

export interface ConversationState {
    status: ConversationStatus;
    currentAgentId?: string;
    isTyping: boolean;
    lastError?: string;
    pendingToolConfirmations: ToolExecution[];
}

// Conversation history indexing (for RAG)
export interface ConversationIndexEntry {
    conversationId: string;
    messageId: string;
    content: string;
    role: 'user' | 'assistant';
    agentId?: string;
    timestamp: number;
    embedding?: number[];
    metadata: {
        conversationTitle?: string;
        tags?: string[];
        archived: boolean;
    };
}

// Export/Import
export interface ConversationExport {
    version: string;
    exportDate: number;
    conversations: Conversation[];
    metadata?: Record<string, any>;
}

export interface ConversationImportOptions {
    overwriteExisting: boolean;
    preserveIds: boolean;
    setAsArchived: boolean;
}
