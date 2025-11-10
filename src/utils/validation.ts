import { ValidationResult } from '../types';
import { AgentConfig, LLMProviderConfig } from '../settings';

/**
 * Validate an API key format
 */
export function validateApiKey(key: string, type: 'openai' | 'anthropic'): boolean {
    if (!key || typeof key !== 'string') {
        return false;
    }

    switch (type) {
        case 'openai':
            // OpenAI keys start with 'sk-'
            return key.startsWith('sk-') && key.length > 20;

        case 'anthropic':
            // Anthropic keys start with 'sk-ant-'
            return key.startsWith('sk-ant-') && key.length > 20;

        default:
            return key.length > 10;
    }
}

/**
 * Validate LLM provider configuration
 */
export function validateProviderConfig(config: LLMProviderConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.id || config.id.trim().length === 0) {
        errors.push('Provider ID is required');
    }

    if (!config.name || config.name.trim().length === 0) {
        errors.push('Provider name is required');
    }

    if (!config.type) {
        errors.push('Provider type is required');
    }

    if (!config.model || config.model.trim().length === 0) {
        errors.push('Model name is required');
    }

    if (config.temperature !== undefined) {
        if (config.temperature < 0 || config.temperature > 2) {
            errors.push('Temperature must be between 0 and 2');
        }
    }

    if (config.maxTokens !== undefined) {
        if (config.maxTokens < 1 || config.maxTokens > 200000) {
            errors.push('Max tokens must be between 1 and 200000');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate agent configuration
 */
export function validateAgentConfig(config: AgentConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.id || config.id.trim().length === 0) {
        errors.push('Agent ID is required');
    }

    if (!config.name || config.name.trim().length === 0) {
        errors.push('Agent name is required');
    }

    if (!config.description || config.description.trim().length === 0) {
        errors.push('Agent description is required');
    }

    if (!config.systemPrompt || config.systemPrompt.trim().length === 0) {
        errors.push('System prompt is required');
    }

    if (!config.llmProviderId) {
        errors.push('LLM provider must be specified');
    }

    if (config.retrievalSettings) {
        if (config.retrievalSettings.topK < 1 || config.retrievalSettings.topK > 50) {
            errors.push('Top K must be between 1 and 50');
        }

        if (config.retrievalSettings.scoreThreshold < 0 || config.retrievalSettings.scoreThreshold > 1) {
            errors.push('Score threshold must be between 0 and 1');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize a file path for vault usage
 */
export function sanitizePath(path: string): string {
    // Remove leading/trailing slashes and spaces
    let sanitized = path.trim().replace(/^\/+|\/+$/g, '');

    // Replace multiple slashes with single slash
    sanitized = sanitized.replace(/\/+/g, '/');

    // Remove any dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '');

    return sanitized;
}

/**
 * Validate a folder path
 */
export function validateFolderPath(path: string): ValidationResult {
    const errors: string[] = [];

    if (!path) {
        errors.push('Path cannot be empty');
    }

    const sanitized = sanitizePath(path);

    if (sanitized !== path) {
        errors.push('Path contains invalid characters');
    }

    if (sanitized.includes('..')) {
        errors.push('Path cannot contain parent directory references (..)');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate a URL
 */
export function validateUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate JSON string
 */
export function validateJson(json: string): ValidationResult {
    try {
        JSON.parse(json);
        return { valid: true, errors: [] };
    } catch (error) {
        return {
            valid: false,
            errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
    }
}