/**
 * Provider Manager
 * Registry and selector for LLM providers
 * FR-002, FR-005: Provider registry and selection
 */

import { App } from 'obsidian';
import { LLMProvider, ProviderInitConfig, ValidationResult } from '../types/Provider';
import { ProviderConfig } from '../types/Settings';
import { handleError, createProviderError } from '../utils/ErrorHandling';
import { KeyManager } from '../security/KeyManager';

export class ProviderManager {
    private providers: Map<string, LLMProvider> = new Map();
    private keyManager: KeyManager;
    private app: App;

    constructor(keyManager: KeyManager, app: App) {
        this.keyManager = keyManager;
        this.app = app;
    }

    /**
     * Register a provider instance
     */
    registerProvider(provider: LLMProvider): void {
        this.providers.set(provider.id, provider);
    }

    /**
     * Initialize a provider with configuration
     * FR-002: Provider initialization
     */
    async initializeProvider(config: ProviderConfig): Promise<void> {
        const provider = this.providers.get(config.id);
        if (!provider) {
            throw createProviderError(
                `Provider ${config.id} not registered`,
                'PROVIDER_NOT_FOUND'
            );
        }

        try {
            // Decrypt API key if present
            let apiKey: string | undefined;
            if (config.apiKey) {
                const encryptedData = JSON.parse(config.apiKey);
                apiKey = await this.keyManager.decryptKey(config.id, encryptedData);
            }

            const initConfig: ProviderInitConfig = {
                apiKey,
                endpoint: config.endpoint,
                model: config.model,
                app: this.app
            };

            await provider.initialize(initConfig);
        } catch (error) {
            handleError(error instanceof Error ? error : new Error(String(error)), {
                context: {
                    operation: 'initializeProvider',
                    timestamp: Date.now(),
                    details: { providerId: config.id }
                }
            });
            throw error;
        }
    }

    /**
     * Get a provider by ID
     * FR-005: Provider selection
     */
    getProvider(providerId: string): LLMProvider | undefined {
        return this.providers.get(providerId);
    }

    /**
     * Get all registered providers
     */
    getAllProviders(): LLMProvider[] {
        return Array.from(this.providers.values());
    }

    /**
     * Get enabled providers
     */
    getEnabledProviders(configs: ProviderConfig[]): LLMProvider[] {
        return configs
            .filter(config => config.enabled)
            .map(config => this.providers.get(config.id))
            .filter((p): p is LLMProvider => p !== undefined);
    }

    /**
     * Validate a provider configuration
     * FR-003, FR-004: API key validation
     */
    async validateProvider(config: ProviderConfig): Promise<ValidationResult> {
        const provider = this.providers.get(config.id);
        if (!provider) {
            return {
                valid: false,
                error: 'Provider not found'
            };
        }

        try {
            // Initialize and validate
            await this.initializeProvider(config);
            const result = await provider.validate();
            return result;
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Health check for all providers
     */
    async healthCheck(): Promise<Map<string, boolean>> {
        const health = new Map<string, boolean>();

        for (const [id, provider] of this.providers) {
            try {
                const result = await provider.healthCheck();
                health.set(id, result.status === 'healthy');
            } catch {
                health.set(id, false);
            }
        }

        return health;
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.providers.clear();
    }
}
