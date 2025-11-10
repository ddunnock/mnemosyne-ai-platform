export class ProviderError extends Error {
    constructor(message: string, public provider: string) {
        super(message);
        this.name = 'ProviderError';
    }
}

export class AgentError extends Error {
    constructor(message: string, public agentId: string) {
        super(message);
        this.name = 'AgentError';
    }
}

export class ToolExecutionError extends Error {
    constructor(message: string, public tool: string) {
        super(message);
        this.name = 'ToolExecutionError';
    }
}

export class ValidationError extends Error {
    constructor(message: string, public field: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class EncryptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EncryptionError';
    }
}

export class RAGError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RAGError';
    }
}

export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigurationError';
    }
}

/**
 * Format error for user-friendly display
 */
export function formatErrorForUser(error: Error): string {
    if (error instanceof ProviderError) {
        return `LLM Provider Error (${error.provider}): ${error.message}`;
    }

    if (error instanceof AgentError) {
        return `Agent Error (${error.agentId}): ${error.message}`;
    }

    if (error instanceof ToolExecutionError) {
        return `Tool Execution Error (${error.tool}): ${error.message}`;
    }

    if (error instanceof ValidationError) {
        return `Validation Error (${error.field}): ${error.message}`;
    }

    if (error instanceof EncryptionError) {
        return `Security Error: ${error.message}`;
    }

    if (error instanceof RAGError) {
        return `Search Error: ${error.message}`;
    }

    if (error instanceof ConfigurationError) {
        return `Configuration Error: ${error.message}`;
    }

    return `Error: ${error.message}`;
}