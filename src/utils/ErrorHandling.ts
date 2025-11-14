/**
 * Error Handling Utilities
 * Standardized error formatting and handling
 */

import { Notice } from 'obsidian';

export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public category: ErrorCategory,
        public retryable: boolean = false,
        public cause?: Error
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export enum ErrorCategory {
    PROVIDER = 'provider',
    AGENT = 'agent',
    RAG = 'rag',
    MCP = 'mcp',
    STORAGE = 'storage',
    SECURITY = 'security',
    NETWORK = 'network',
    VALIDATION = 'validation',
    CONFIGURATION = 'configuration',
    UNKNOWN = 'unknown',
}

export interface ErrorContext {
    operation: string;
    details?: Record<string, any>;
    timestamp: number;
    stack?: string;
}

/**
 * Format an error for user display
 */
export function formatErrorForUser(error: Error | AppError): string {
    if (error instanceof AppError) {
        return formatAppError(error);
    }

    // Generic error
    return `An error occurred: ${error.message}`;
}

function formatAppError(error: AppError): string {
    switch (error.category) {
        case ErrorCategory.PROVIDER:
            return formatProviderError(error);
        case ErrorCategory.NETWORK:
            return formatNetworkError(error);
        case ErrorCategory.SECURITY:
            return `Security error: ${error.message}`;
        case ErrorCategory.VALIDATION:
            return `Validation error: ${error.message}`;
        case ErrorCategory.CONFIGURATION:
            return `Configuration error: ${error.message}`;
        default:
            return error.message;
    }
}

function formatProviderError(error: AppError): string {
    const baseMessage = `LLM provider error: ${error.message}`;

    if (error.code === 'INVALID_API_KEY') {
        return `${baseMessage}\n\nPlease check your API key in Settings.`;
    }

    if (error.code === 'RATE_LIMIT') {
        return `${baseMessage}\n\nPlease wait a moment and try again.`;
    }

    if (error.code === 'CONTEXT_LENGTH_EXCEEDED') {
        return `${baseMessage}\n\nTry starting a new conversation or enabling context compression.`;
    }

    return baseMessage;
}

function formatNetworkError(error: AppError): string {
    if (error.retryable) {
        return `Network error: ${error.message}\n\nThis error is temporary. Please try again.`;
    }

    return `Network error: ${error.message}`;
}

/**
 * Show an error notice to the user
 */
export function showErrorNotice(error: Error | AppError, duration: number = 6000): void {
    const message = formatErrorForUser(error);
    new Notice(message, duration);
}

/**
 * Log an error with context
 */
export function logError(error: Error | AppError, context?: ErrorContext): void {
    console.error('[Mnemosyne Error]', {
        message: error.message,
        name: error.name,
        ...(error instanceof AppError && {
            code: error.code,
            category: error.category,
            retryable: error.retryable,
        }),
        context,
        stack: error.stack,
    });
}

/**
 * Handle an error: log it and optionally show to user
 */
export function handleError(
    error: Error | AppError,
    options: {
        showNotice?: boolean;
        context?: ErrorContext;
        rethrow?: boolean;
    } = {}
): void {
    const { showNotice = true, context, rethrow = false } = options;

    logError(error, context);

    if (showNotice) {
        showErrorNotice(error);
    }

    if (rethrow) {
        throw error;
    }
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    options: {
        operation: string;
        showNotice?: boolean;
        defaultValue?: T;
    }
): (...args: Args) => Promise<T | undefined> {
    return async (...args: Args): Promise<T | undefined> => {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(
                error instanceof Error ? error : new Error(String(error)),
                {
                    showNotice: options.showNotice,
                    context: {
                        operation: options.operation,
                        timestamp: Date.now(),
                    },
                }
            );
            return options.defaultValue;
        }
    };
}

/**
 * Create a user-friendly validation error
 */
export function createValidationError(field: string, message: string): AppError {
    return new AppError(
        `Invalid ${field}: ${message}`,
        'VALIDATION_ERROR',
        ErrorCategory.VALIDATION,
        false
    );
}

/**
 * Create a network error with retry information
 */
export function createNetworkError(message: string, retryable: boolean = true): AppError {
    return new AppError(
        message,
        'NETWORK_ERROR',
        ErrorCategory.NETWORK,
        retryable
    );
}

/**
 * Create a provider error
 */
export function createProviderError(
    message: string,
    code: string,
    retryable: boolean = false
): AppError {
    return new AppError(
        message,
        code,
        ErrorCategory.PROVIDER,
        retryable
    );
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error | AppError): boolean {
    if (error instanceof AppError) {
        return error.retryable;
    }

    // Check for common retryable error messages
    const message = error.message.toLowerCase();
    return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
    );
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        backoffFactor?: number;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
        onRetry,
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt === maxRetries || !isRetryableError(lastError)) {
                throw lastError;
            }

            if (onRetry) {
                onRetry(attempt + 1, lastError);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }

    throw lastError!;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
        return JSON.parse(json) as T;
    } catch (error) {
        logError(
            error instanceof Error ? error : new Error('JSON parse error'),
            {
                operation: 'safeJsonParse',
                timestamp: Date.now(),
                details: { json: json.substring(0, 100) },
            }
        );
        return defaultValue;
    }
}

/**
 * Safe JSON stringify with error handling
 */
export function safeJsonStringify(value: any, defaultValue: string = '{}'): string {
    try {
        return JSON.stringify(value);
    } catch (error) {
        logError(
            error instanceof Error ? error : new Error('JSON stringify error'),
            {
                operation: 'safeJsonStringify',
                timestamp: Date.now(),
            }
        );
        return defaultValue;
    }
}
