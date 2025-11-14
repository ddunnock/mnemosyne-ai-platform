/**
 * Anthropic Provider
 * Integration with Anthropic Claude API using requestUrl()
 * FR-001: Anthropic provider implementation
 * Constitution II: Use requestUrl() instead of fetch
 */

import { requestUrl, RequestUrlParam } from 'obsidian';
import {
    LLMProvider,
    ProviderInitConfig,
    CompletionRequest,
    CompletionResponse,
    ValidationResult,
    ProviderHealth,
    ProviderErrorCode
} from '../types/Provider';
import { ProviderError } from '../types/Provider';

export class AnthropicProvider implements LLMProvider {
    id = 'anthropic';
    name = 'Anthropic';
    type = 'anthropic' as const;

    private apiKey?: string;
    private baseURL = 'https://api.anthropic.com/v1';
    private model = 'claude-3-5-sonnet-20241022';
    private version = '2023-06-01';

    async initialize(config: ProviderInitConfig): Promise<void> {
        this.apiKey = config.apiKey;
        if (config.endpoint) {
            this.baseURL = config.endpoint;
        }
        if (config.model) {
            this.model = config.model;
        }
    }

    async validate(): Promise<ValidationResult> {
        if (!this.apiKey) {
            return {
                valid: false,
                error: 'API key not configured'
            };
        }

        try {
            // Test with a minimal completion request
            const response = await requestUrl({
                url: `${this.baseURL}/messages`,
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': this.version,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10
                })
            });

            if (response.status === 200) {
                return {
                    valid: true,
                    message: 'API key validated successfully'
                };
            }

            return {
                valid: false,
                error: `Validation failed: ${response.status}`
            };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        if (!this.apiKey) {
            throw new ProviderError(
                'API key not configured',
                this.id,
                ProviderErrorCode.INVALID_API_KEY
            );
        }

        const model = request.model || this.model;

        // Anthropic requires system prompt separate from messages
        const system = request.systemPrompt || request.messages.find(m => m.role === 'system')?.content;
        const messages = request.messages.filter(m => m.role !== 'system');

        try {
            const requestParam: RequestUrlParam = {
                url: `${this.baseURL}/messages`,
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': this.version,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    system,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.maxTokens || 4096,
                    tools: request.tools
                })
            };

            const response = await requestUrl(requestParam);

            if (response.status !== 200) {
                throw this.handleError(response.status, response.text);
            }

            const data = response.json;

            // Extract text content from content blocks
            const content = data.content
                .filter((block: any) => block.type === 'text')
                .map((block: any) => block.text)
                .join('');

            // Extract tool calls if present
            const toolCalls = data.content
                .filter((block: any) => block.type === 'tool_use')
                .map((block: any) => ({
                    id: block.id,
                    name: block.name,
                    arguments: block.input
                }));

            return {
                content,
                finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                usage: data.usage ? {
                    promptTokens: data.usage.input_tokens,
                    completionTokens: data.usage.output_tokens,
                    totalTokens: data.usage.input_tokens + data.usage.output_tokens
                } : undefined,
                model: data.model
            };
        } catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }
            throw new ProviderError(
                error instanceof Error ? error.message : 'Unknown error',
                this.id,
                ProviderErrorCode.UNKNOWN
            );
        }
    }

    async streamComplete(
        request: CompletionRequest,
        onChunk: (chunk: string) => void,
        onComplete: (response: CompletionResponse) => void,
        onError: (error: Error) => void
    ): Promise<void> {
        // Streaming requires XMLHttpRequest or native fetch which aren't available
        // Fall back to non-streaming for now
        try {
            const response = await this.complete(request);
            onChunk(response.content);
            onComplete(response);
        } catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getAvailableModels(): Promise<string[]> {
        // Anthropic doesn't have a models endpoint, return known models
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }

    async healthCheck(): Promise<ProviderHealth> {
        const start = Date.now();

        try {
            const result = await this.validate();
            const latency = Date.now() - start;

            return {
                status: result.valid ? 'healthy' : 'unhealthy',
                latency,
                lastChecked: Date.now(),
                error: result.error
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                lastChecked: Date.now(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private handleError(status: number, text: string): ProviderError {
        const message = `Anthropic API error: ${status} ${text}`;

        if (status === 401) {
            return new ProviderError(message, this.id, ProviderErrorCode.INVALID_API_KEY);
        }
        if (status === 429) {
            return new ProviderError(message, this.id, ProviderErrorCode.RATE_LIMIT, true);
        }
        if (status >= 500) {
            return new ProviderError(message, this.id, ProviderErrorCode.NETWORK_ERROR, true);
        }

        return new ProviderError(message, this.id, ProviderErrorCode.UNKNOWN);
    }
}
