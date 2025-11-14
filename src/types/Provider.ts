/**
 * LLM Provider Interfaces
 * Defines the contract for all LLM provider implementations
 */

import { App } from 'obsidian';

export interface LLMProvider {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'local';

    /**
     * Initialize the provider with API credentials
     */
    initialize(config: ProviderInitConfig): Promise<void>;

    /**
     * Validate API key and connectivity
     */
    validate(): Promise<ValidationResult>;

    /**
     * Generate a completion (non-streaming)
     */
    complete(request: CompletionRequest): Promise<CompletionResponse>;

    /**
     * Generate a streaming completion
     */
    streamComplete(
        request: CompletionRequest,
        onChunk: (chunk: string) => void,
        onComplete: (response: CompletionResponse) => void,
        onError: (error: Error) => void
    ): Promise<void>;

    /**
     * Get available models for this provider
     */
    getAvailableModels(): Promise<string[]>;

    /**
     * Check if the provider is healthy
     */
    healthCheck(): Promise<ProviderHealth>;
}

export interface ProviderInitConfig {
    apiKey?: string;
    endpoint?: string;
    model?: string;
    app: App;  // For requestUrl() access
}

export interface CompletionRequest {
    messages: Message[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    tools?: ToolDefinition[];
}

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    name?: string;
    toolCalls?: ToolCall[];
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, any>;
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
}

export interface CompletionResponse {
    content: string;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'error';
    toolCalls?: ToolCall[];
    usage?: TokenUsage;
    model: string;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
    message?: string;
}

export interface ProviderHealth {
    status: 'healthy' | 'unhealthy' | 'unknown';
    latency?: number;
    lastChecked: number;
    error?: string;
}

export interface ProviderMetadata {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'local';
    supportsStreaming: boolean;
    supportsTools: boolean;
    defaultModels: string[];
    maxContextTokens: number;
}

// Provider-specific configurations

export interface OpenAIProviderConfig extends ProviderInitConfig {
    organization?: string;
    baseURL?: string;
}

export interface AnthropicProviderConfig extends ProviderInitConfig {
    version?: string;  // API version
}

export interface LocalProviderConfig extends ProviderInitConfig {
    endpoint: string;  // Required for local providers
    authToken?: string;
    modelPath?: string;
}

// Error types

export class ProviderError extends Error {
    constructor(
        message: string,
        public providerId: string,
        public code: ProviderErrorCode,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'ProviderError';
    }
}

export enum ProviderErrorCode {
    INVALID_API_KEY = 'INVALID_API_KEY',
    RATE_LIMIT = 'RATE_LIMIT',
    NETWORK_ERROR = 'NETWORK_ERROR',
    INVALID_REQUEST = 'INVALID_REQUEST',
    MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
    CONTEXT_LENGTH_EXCEEDED = 'CONTEXT_LENGTH_EXCEEDED',
    TIMEOUT = 'TIMEOUT',
    UNKNOWN = 'UNKNOWN',
}
