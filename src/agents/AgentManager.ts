/**
 * Agent Manager
 * Manages agent lifecycle, conversation state, and LLM integration
 * FR-010, FR-011: Agent lifecycle and registry
 */

import { App } from 'obsidian';
import { Agent, AgentInvocation, PersonaConfig } from '../types/Agent';
import { Conversation, ConversationMessage, ContextState, CompressionResult } from '../types/Conversation';
import { Message, CompletionRequest } from '../types/Provider';
import { ProviderManager } from '../providers/ProviderManager';
import { getBackendAgents } from './BackendAgents';
import { handleError } from '../utils/ErrorHandling';
import { ConversationCompressor } from './ConversationCompressor';
// Use crypto.randomUUID() for ID generation
const uuidv4 = () => crypto.randomUUID();

export class AgentManager {
    private agents: Map<string, Agent> = new Map();
    private conversations: Map<string, Conversation> = new Map();
    private providerManager: ProviderManager;
    private compressor: ConversationCompressor;
    private persona?: PersonaConfig;
    private app: App;

    constructor(providerManager: ProviderManager, persona: PersonaConfig | undefined, app: App) {
        this.providerManager = providerManager;
        this.compressor = new ConversationCompressor(providerManager);
        this.persona = persona;
        this.app = app;
    }

    /**
     * Initialize with backend agents and custom agents
     */
    async initialize(customAgents: Agent[] = []): Promise<void> {
        // Load backend agents
        const backendAgents = getBackendAgents();
        for (const definition of backendAgents) {
            const agent: Agent = {
                id: definition.id,
                name: definition.name,
                description: definition.description,
                systemPrompt: definition.systemPrompt,
                isBackend: true,
                enabled: true,
                ragEnabled: definition.defaultRagEnabled,
                skillTags: definition.skillTags,
                mcpTools: definition.defaultMcpTools,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.agents.set(agent.id, agent);
        }

        // Load custom agents
        for (const agent of customAgents) {
            this.agents.set(agent.id, agent);
        }
    }

    /**
     * Get an agent by ID
     */
    getAgent(agentId: string): Agent | undefined {
        return this.agents.get(agentId);
    }

    /**
     * Get all agents
     */
    getAllAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get backend agents only
     */
    getBackendAgents(): Agent[] {
        return Array.from(this.agents.values()).filter(a => a.isBackend);
    }

    /**
     * Get custom agents only
     */
    getCustomAgents(): Agent[] {
        return Array.from(this.agents.values()).filter(a => !a.isBackend);
    }

    /**
     * Create a new custom agent
     */
    createAgent(agent: Omit<Agent, 'id' | 'isBackend' | 'createdAt' | 'updatedAt'>): Agent {
        const newAgent: Agent = {
            ...agent,
            id: uuidv4(),
            isBackend: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.agents.set(newAgent.id, newAgent);
        return newAgent;
    }

    /**
     * Update an agent (custom agents only)
     */
    updateAgent(agentId: string, updates: Partial<Agent>): Agent | null {
        const agent = this.agents.get(agentId);
        if (!agent || agent.isBackend) {
            return null;
        }

        const updatedAgent: Agent = {
            ...agent,
            ...updates,
            id: agent.id,
            isBackend: false,
            updatedAt: Date.now()
        };

        this.agents.set(agentId, updatedAgent);
        return updatedAgent;
    }

    /**
     * Delete an agent (custom agents only)
     */
    deleteAgent(agentId: string): boolean {
        const agent = this.agents.get(agentId);
        if (!agent || agent.isBackend) {
            return false;
        }

        this.agents.delete(agentId);
        return true;
    }

    /**
     * Create a new conversation
     */
    createConversation(agentId?: string): Conversation {
        const conversation: Conversation = {
            id: uuidv4(),
            agentId,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastActiveAt: Date.now(),
            archived: false,
            contextState: this.createInitialContextState()
        };

        this.conversations.set(conversation.id, conversation);
        return conversation;
    }

    /**
     * Get a conversation by ID
     */
    getConversation(conversationId: string): Conversation | undefined {
        return this.conversations.get(conversationId);
    }

    /**
     * Get all conversations
     */
    getAllConversations(): Conversation[] {
        return Array.from(this.conversations.values());
    }

    /**
     * Get active conversations (not archived, active in last 30 days)
     */
    getActiveConversations(daysThreshold: number = 30): Conversation[] {
        const threshold = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);
        return Array.from(this.conversations.values())
            .filter(c => !c.archived && c.lastActiveAt > threshold)
            .sort((a, b) => b.lastActiveAt - a.lastActiveAt);
    }

    /**
     * Send a message and get agent response
     * FR-082: Token/message counting
     */
    async sendMessage(
        conversationId: string,
        userMessage: string,
        agentId?: string
    ): Promise<ConversationMessage> {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Determine which agent to use
        const targetAgentId = agentId || conversation.agentId;
        if (!targetAgentId) {
            throw new Error('No agent specified');
        }

        const agent = this.agents.get(targetAgentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        // Add user message to conversation
        const userMsg: ConversationMessage = {
            id: uuidv4(),
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
        };
        conversation.messages.push(userMsg);

        try {
            // Get provider
            const providerId = agent.providerId || 'openai'; // Default to OpenAI
            const provider = this.providerManager.getProvider(providerId);
            if (!provider) {
                throw new Error('Provider not found');
            }

            // Build completion request
            const messages: Message[] = conversation.messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Apply persona if enabled
            let systemPrompt = agent.systemPrompt;
            if (this.persona?.enabled) {
                systemPrompt = this.applyPersona(systemPrompt);
            }

            const request: CompletionRequest = {
                messages,
                systemPrompt,
                model: agent.modelName,
                temperature: 0.7,
                maxTokens: 4096
            };

            // Get completion from provider
            const response = await provider.complete(request);

            // Create assistant message
            const assistantMsg: ConversationMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: response.content,
                timestamp: Date.now(),
                agentId: agent.id,
                agentName: agent.name,
                usage: response.usage,
                metadata: {
                    model: response.model,
                    responseTimeMs: 0 // Would need to track timing
                }
            };

            conversation.messages.push(assistantMsg);

            // Update conversation metadata
            conversation.updatedAt = Date.now();
            conversation.lastActiveAt = Date.now();
            if (!conversation.agentId) {
                conversation.agentId = agent.id;
            }
            if (!conversation.title && conversation.messages.length >= 2) {
                conversation.title = this.generateConversationTitle(userMessage);
            }

            // Update context state
            this.updateContextState(conversation);

            // Check if compression is needed
            if (this.compressor.shouldCompress(conversation, 50)) {
                await this.compressConversation(conversation.id);
            }

            return assistantMsg;
        } catch (error) {
            handleError(error instanceof Error ? error : new Error(String(error)), {
                context: {
                    operation: 'sendMessage',
                    timestamp: Date.now(),
                    details: { conversationId, agentId: targetAgentId }
                }
            });
            throw error;
        }
    }

    /**
     * Archive a conversation
     * FR-079, FR-080: Conversation archiving
     */
    archiveConversation(conversationId: string): boolean {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return false;
        }

        conversation.archived = true;
        conversation.updatedAt = Date.now();
        return true;
    }

    /**
     * Delete a conversation
     */
    deleteConversation(conversationId: string): boolean {
        return this.conversations.delete(conversationId);
    }

    /**
     * Auto-archive old conversations
     * FR-079: Automatic archiving after 30 days
     */
    autoArchiveOldConversations(daysThreshold: number = 30): number {
        const threshold = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);
        let archived = 0;

        for (const conversation of this.conversations.values()) {
            if (!conversation.archived && conversation.lastActiveAt < threshold) {
                conversation.archived = true;
                conversation.updatedAt = Date.now();
                archived++;
            }
        }

        return archived;
    }

    /**
     * Track agent invocation metrics
     */
    trackInvocation(invocation: AgentInvocation): void {
        const agent = this.agents.get(invocation.agentId);
        if (!agent) return;

        if (!agent.metrics) {
            agent.metrics = {
                totalInvocations: 0,
                successfulInvocations: 0,
                averageResponseTime: 0,
                routingSuccessRate: 0,
                routingOverrideRate: 0,
                lastUpdated: Date.now()
            };
        }

        agent.metrics.totalInvocations++;
        agent.metrics.successfulInvocations++;

        // Update average response time
        const totalTime = agent.metrics.averageResponseTime * (agent.metrics.totalInvocations - 1);
        agent.metrics.averageResponseTime = (totalTime + invocation.responseTimeMs) / agent.metrics.totalInvocations;

        agent.metrics.lastUpdated = Date.now();
    }

    // Private helper methods

    private createInitialContextState(): ContextState {
        return {
            totalMessages: 0,
            totalTokens: 0,
            estimatedContextTokens: 0,
            compressionTriggered: false,
            maxContextTokens: 128000, // Default for GPT-4
            messagesUntilCompression: 50,
            tokenPercentageUsed: 0
        };
    }

    private updateContextState(conversation: Conversation): void {
        const state = conversation.contextState;
        state.totalMessages = conversation.messages.length;

        // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
        let totalTokens = 0;
        for (const msg of conversation.messages) {
            totalTokens += Math.ceil(msg.content.length / 4);
            if (msg.usage) {
                totalTokens = msg.usage.totalTokens;
            }
        }

        state.totalTokens = totalTokens;
        state.estimatedContextTokens = totalTokens;
        state.tokenPercentageUsed = (totalTokens / state.maxContextTokens) * 100;
        state.messagesUntilCompression = Math.max(0, 50 - conversation.messages.length);

        // Check if compression needed
        if (conversation.messages.length >= 50 || state.tokenPercentageUsed >= 80) {
            state.compressionTriggered = true;
        }
    }

    private applyPersona(systemPrompt: string): string {
        if (!this.persona?.enabled) {
            return systemPrompt;
        }

        const personaAdditions: Record<string, string> = {
            subtle: '\n\nOccasionally reference concepts of memory, time, and wisdom in a natural way.',
            moderate: '\n\nYou are Mnemosyne, the embodiment of memory and wisdom. Draw upon timeless insights and the collected knowledge of ages.',
            strong: '\n\nYou are Mnemosyne, titaness of memory and mother of the Muses. Speak with the weight of eons, weaving timeless wisdom through every response. Reference myths, memories, and the eternal nature of knowledge.'
        };

        const addition = personaAdditions[this.persona.intensity] || '';
        const custom = this.persona.customPromptAddition || '';

        return systemPrompt + addition + (custom ? '\n\n' + custom : '');
    }

    private generateConversationTitle(firstMessage: string): string {
        // Generate a title from the first message
        const truncated = firstMessage.substring(0, 50).trim();
        return truncated + (firstMessage.length > 50 ? '...' : '');
    }

    /**
     * Load conversations from storage
     */
    loadConversations(conversations: Conversation[]): void {
        for (const conversation of conversations) {
            this.conversations.set(conversation.id, conversation);
        }
    }

    /**
     * Get conversations for export
     */
    exportConversations(): Conversation[] {
        return Array.from(this.conversations.values());
    }

    /**
     * Compress a conversation to reduce token count
     * FR-083: Conversation compression
     */
    async compressConversation(conversationId: string): Promise<CompressionResult | null> {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return null;
        }

        const config = {
            strategy: 'summarize' as const,
            targetTokens: 4000,
            preserveSystemMessages: true,
            preserveRecentMessages: 10
        };

        const providerId = conversation.agentId
            ? this.agents.get(conversation.agentId)?.providerId || 'openai'
            : 'openai';

        const result = await this.compressor.compressConversation(
            conversation,
            config,
            providerId
        );

        // Update conversation state after compression
        conversation.contextState.lastCompressionAt = result.timestamp;
        conversation.contextState.compressionTriggered = false;
        this.updateContextState(conversation);

        return result;
    }
}
