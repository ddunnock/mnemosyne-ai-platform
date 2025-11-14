/**
 * OpenAI Provider
 * Integration with OpenAI API using requestUrl()
 * FR-001: OpenAI provider implementation
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

export class OpenAIProvider implements LLMProvider {
    id = 'openai';
    name = 'OpenAI';
    type = 'openai' as const;

    private apiKey?: string;
    private baseURL = 'https://api.openai.com/v1';
    private model = 'gpt-4-turbo-preview';

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
            // Test API key with a simple models list request
            const response = await requestUrl({
                url: `${this.baseURL}/models`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
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
        const messages = request.systemPrompt
            ? [{ role: 'system', content: request.systemPrompt }, ...request.messages]
            : request.messages;

        try {
            const requestParam: RequestUrlParam = {
                url: `${this.baseURL}/chat/completions`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.maxTokens,
                    tools: request.tools
                })
            };

            const response = await requestUrl(requestParam);

            if (response.status !== 200) {
                throw this.handleError(response.status, response.text);
            }

            const data = response.json;
            const choice = data.choices[0];

            return {
                content: choice.message.content || '',
                finishReason: choice.finish_reason as any,
                toolCalls: choice.message.tool_calls,
                usage: data.usage ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens
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
        if (!this.apiKey) {
            return [];
        }

        try {
            const response = await requestUrl({
                url: `${this.baseURL}/models`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const data = response.json;
                return data.data
                    .filter((m: any) => m.id.includes('gpt'))
                    .map((m: any) => m.id);
            }

            return [];
        } catch {
            return [];
        }
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
        const message = `OpenAI API error: ${status} ${text}`;

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
