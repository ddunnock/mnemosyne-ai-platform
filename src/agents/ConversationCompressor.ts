/**
 * Conversation Compression Manager
 * Handles context compression when approaching token limits
 * FR-084, FR-085: Context compression with summarization
 */

import { Conversation, ConversationMessage, CompressionResult, CompressionConfig } from '../types/Conversation';
import { ProviderManager } from '../providers/ProviderManager';
import { CompletionRequest } from '../types/Provider';

export class ConversationCompressor {
    private providerManager: ProviderManager;

    constructor(providerManager: ProviderManager) {
        this.providerManager = providerManager;
    }

    /**
     * Compress a conversation using the configured strategy
     * FR-084: Preserve critical info (user preferences, key decisions, ongoing tasks)
     */
    async compressConversation(
        conversation: Conversation,
        config: CompressionConfig,
        providerId: string = 'openai'
    ): Promise<CompressionResult> {
        const strategy = config.strategy;

        switch (strategy) {
            case 'summarize':
                return await this.summarizeConversation(conversation, config, providerId);
            case 'truncate':
                return this.truncateConversation(conversation, config);
            case 'sliding-window':
                return this.slidingWindowCompression(conversation, config);
            default:
                return this.truncateConversation(conversation, config);
        }
    }

    /**
     * Summarize conversation preserving critical information
     * FR-085: Preserve user preferences, key decisions, ongoing tasks
     */
    private async summarizeConversation(
        conversation: Conversation,
        config: CompressionConfig,
        providerId: string
    ): Promise<CompressionResult> {
        const provider = this.providerManager.getProvider(providerId);
        if (!provider) {
            // Fallback to truncation if provider unavailable
            return this.truncateConversation(conversation, config);
        }

        const originalMessageCount = conversation.messages.length;
        const originalTokenCount = conversation.contextState.totalTokens;

        // Preserve recent messages
        const recentMessages = conversation.messages.slice(-config.preserveRecentMessages);
        const messagesToSummarize = conversation.messages.slice(0, -config.preserveRecentMessages);

        if (messagesToSummarize.length === 0) {
            // Nothing to summarize
            return {
                originalMessageCount,
                compressedMessageCount: originalMessageCount,
                originalTokenCount,
                compressedTokenCount: originalTokenCount,
                preservedMessageIds: conversation.messages.map(m => m.id),
                removedMessageIds: [],
                timestamp: Date.now()
            };
        }

        // Create summarization prompt
        const conversationText = messagesToSummarize
            .map(m => `${m.role}: ${m.content}`)
            .join('\n\n');

        const summarizationPrompt = config.summarizationPrompt || `Summarize the following conversation, preserving:
- User preferences and settings mentioned
- Key decisions made
- Ongoing tasks or action items
- Important context needed for future messages

Keep the summary concise but complete.

Conversation:
${conversationText}`;

        try {
            const request: CompletionRequest = {
                messages: [{ role: 'user', content: summarizationPrompt }],
                temperature: 0.3, // Lower temperature for more factual summarization
                maxTokens: Math.min(1000, Math.floor(config.targetTokens / 2))
            };

            const response = await provider.complete(request);

            // Create summary message
            const summaryMessage: ConversationMessage = {
                id: crypto.randomUUID(),
                role: 'system',
                content: `[Conversation Summary]\n${response.content}`,
                timestamp: Date.now(),
                metadata: {
                    isSummary: true,
                    summarizedMessages: messagesToSummarize.length
                }
            };

            // Replace old messages with summary + recent messages
            conversation.messages = [summaryMessage, ...recentMessages];

            const compressedTokenCount = Math.floor(originalTokenCount * 0.3); // Estimate

            return {
                originalMessageCount,
                compressedMessageCount: conversation.messages.length,
                originalTokenCount,
                compressedTokenCount,
                summary: response.content,
                preservedMessageIds: recentMessages.map(m => m.id),
                removedMessageIds: messagesToSummarize.map(m => m.id),
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Summarization failed, falling back to truncation:', error);
            return this.truncateConversation(conversation, config);
        }
    }

    /**
     * Simple truncation - remove oldest messages
     */
    private truncateConversation(
        conversation: Conversation,
        config: CompressionConfig
    ): CompressionResult {
        const originalMessageCount = conversation.messages.length;
        const originalTokenCount = conversation.contextState.totalTokens;

        // Keep system messages if configured
        const systemMessages = config.preserveSystemMessages
            ? conversation.messages.filter(m => m.role === 'system')
            : [];

        // Keep recent messages
        const recentMessages = conversation.messages
            .filter(m => !config.preserveSystemMessages || m.role !== 'system')
            .slice(-config.preserveRecentMessages);

        const removedMessages = conversation.messages
            .filter(m => !systemMessages.includes(m) && !recentMessages.includes(m));

        conversation.messages = [...systemMessages, ...recentMessages];

        const compressedTokenCount = Math.floor(
            (conversation.messages.length / originalMessageCount) * originalTokenCount
        );

        return {
            originalMessageCount,
            compressedMessageCount: conversation.messages.length,
            originalTokenCount,
            compressedTokenCount,
            preservedMessageIds: conversation.messages.map(m => m.id),
            removedMessageIds: removedMessages.map(m => m.id),
            timestamp: Date.now()
        };
    }

    /**
     * Sliding window - keep most recent messages only
     */
    private slidingWindowCompression(
        conversation: Conversation,
        config: CompressionConfig
    ): CompressionResult {
        const originalMessageCount = conversation.messages.length;
        const originalTokenCount = conversation.contextState.totalTokens;

        const windowSize = config.preserveRecentMessages;
        const removedMessages = conversation.messages.slice(0, -windowSize);

        conversation.messages = conversation.messages.slice(-windowSize);

        const compressedTokenCount = Math.floor(
            (conversation.messages.length / originalMessageCount) * originalTokenCount
        );

        return {
            originalMessageCount,
            compressedMessageCount: conversation.messages.length,
            originalTokenCount,
            compressedTokenCount,
            preservedMessageIds: conversation.messages.map(m => m.id),
            removedMessageIds: removedMessages.map(m => m.id),
            timestamp: Date.now()
        };
    }

    /**
     * Check if compression is needed
     */
    shouldCompress(conversation: Conversation, maxMessages: number, maxTokenPercentage: number = 80): boolean {
        return (
            conversation.messages.length >= maxMessages ||
            conversation.contextState.tokenPercentageUsed >= maxTokenPercentage
        );
    }
}
