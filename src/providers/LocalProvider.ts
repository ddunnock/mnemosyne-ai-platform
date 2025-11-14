/**
 * Local Provider
 * Integration with local LLM endpoints (OpenAI-compatible)
 * FR-001: Local LLM endpoint support
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

export class LocalProvider implements LLMProvider {
    id = 'local';
    name = 'Local LLM';
    type = 'local' as const;

    private endpoint = 'http://localhost:1234/v1';
    private authToken?: string;
    private model = 'local-model';

    async initialize(config: ProviderInitConfig): Promise<void> {
        if (!config.endpoint) {
            throw new ProviderError(
                'Endpoint required for local provider',
                this.id,
                ProviderErrorCode.INVALID_REQUEST
            );
        }

        this.endpoint = config.endpoint;
        this.authToken = config.apiKey;
        if (config.model) {
            this.model = config.model;
        }
    }

    async validate(): Promise<ValidationResult> {
        try {
            // Test connectivity with models endpoint (OpenAI-compatible)
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            const response = await requestUrl({
                url: `${this.endpoint}/models`,
                method: 'GET',
                headers
            });

            if (response.status === 200) {
                return {
                    valid: true,
                    message: 'Local endpoint validated successfully'
                };
            }

            return {
                valid: false,
                error: `Validation failed: ${response.status}`
            };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Cannot connect to local endpoint'
            };
        }
    }

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        const model = request.model || this.model;
        const messages = request.systemPrompt
            ? [{ role: 'system', content: request.systemPrompt }, ...request.messages]
            : request.messages;

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            const requestParam: RequestUrlParam = {
                url: `${this.endpoint}/chat/completions`,
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.maxTokens
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
                usage: data.usage ? {
                    promptTokens: data.usage.prompt_tokens || 0,
                    completionTokens: data.usage.completion_tokens || 0,
                    totalTokens: data.usage.total_tokens || 0
                } : undefined,
                model: data.model || model
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
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            const response = await requestUrl({
                url: `${this.endpoint}/models`,
                method: 'GET',
                headers
            });

            if (response.status === 200) {
                const data = response.json;
                return data.data ? data.data.map((m: any) => m.id) : [this.model];
            }

            return [this.model];
        } catch {
            return [this.model];
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
        const message = `Local LLM error: ${status} ${text}`;

        if (status === 401 || status === 403) {
            return new ProviderError(message, this.id, ProviderErrorCode.INVALID_API_KEY);
        }
        if (status === 429) {
            return new ProviderError(message, this.id, ProviderErrorCode.RATE_LIMIT, true);
        }
        if (status >= 500 || status === 0) {
            return new ProviderError(message, this.id, ProviderErrorCode.NETWORK_ERROR, true);
        }

        return new ProviderError(message, this.id, ProviderErrorCode.UNKNOWN);
    }
}
