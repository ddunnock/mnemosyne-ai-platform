/**
 * Agent Interfaces
 * Defines AI agents with skill tags and routing capabilities
 */

import { Message, ToolDefinition } from './Provider';

export interface Agent {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    isBackend: boolean;  // Backend agents cannot be deleted
    enabled: boolean;

    // Provider configuration
    providerId?: string;  // Override default provider
    modelName?: string;   // Override default model

    // RAG configuration
    ragEnabled: boolean;
    ragConfig?: RAGAgentConfig;

    // Skill tags for orchestrator routing
    skillTags: string[];

    // MCP tool permissions
    mcpTools: string[];

    // Routing performance metrics
    metrics?: AgentMetrics;

    // Creation/modification timestamps
    createdAt: number;
    updatedAt: number;
}

export interface RAGAgentConfig {
    enabled: boolean;
    topK: number;
    threshold: number;
    metadataFilters?: Record<string, any>;
    includeConversationHistory?: boolean;
}

export interface AgentMetrics {
    totalInvocations: number;
    successfulInvocations: number;
    averageResponseTime: number;

    // Orchestrator routing metrics
    routingSuccessRate: number;   // Percentage of times user accepted suggestion
    routingOverrideRate: number;  // Percentage of times user manually overrode

    // Last updated timestamp
    lastUpdated: number;
}

export interface PersonaConfig {
    enabled: boolean;
    intensity: PersonaIntensity;
    customPromptAddition?: string;
}

export type PersonaIntensity = 'none' | 'subtle' | 'moderate' | 'strong';

export interface AgentInvocation {
    agentId: string;
    conversationId: string;
    timestamp: number;
    userMessage: string;
    response: string;
    toolsUsed?: string[];
    sourcesReferenced?: string[];
    tokens?: number;
    responseTimeMs: number;
}

export interface AgentRouting {
    query: string;
    suggestedAgent: string;
    confidence: number;
    alternatives: AgentSuggestion[];
    reasoning: string;
}

export interface AgentSuggestion {
    agentId: string;
    agentName: string;
    confidence: number;
    reasoning: string;
    skillMatches: string[];
}

export interface OrchestratorConfig {
    enabled: boolean;
    maxDelegationDepth: number;
    confidenceThreshold: number;

    // Scoring weights
    skillMatchWeight: number;       // Default: 0.5
    toolAvailabilityWeight: number; // Default: 0.3
    contextScoreWeight: number;     // Default: 0.2

    // Adaptive learning
    adaptiveLearningEnabled: boolean;
    learningAlpha: number;  // Default: 0.1 (exponential moving average)

    // Skill taxonomy
    skillTaxonomy?: SkillTaxonomy;
}

export interface SkillTaxonomy {
    categories: SkillCategory[];
    synonyms: Record<string, string[]>;
}

export interface SkillCategory {
    name: string;
    skills: string[];
    parentCategory?: string;
}

export interface DelegationContext {
    visitedAgents: string[];  // Prevent loops
    depth: number;
    conversationContext: string[];
    originalQuery: string;
}

// Backend Agent Definition
export interface BackendAgentDefinition {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    skillTags: string[];
    defaultRagEnabled: boolean;
    defaultMcpTools: string[];
}

// Custom Agent (user-created)
export interface CustomAgent extends Agent {
    isBackend: false;  // Always false for custom agents
    createdBy: string;
}

// Agent execution context
export interface AgentContext {
    agent: Agent;
    conversationId: string;
    messages: Message[];
    retrievedContext?: RAGContext[];
    availableTools?: ToolDefinition[];
    persona?: PersonaConfig;
}

export interface RAGContext {
    filePath: string;
    title: string;
    excerpt: string;
    score: number;
    metadata?: Record<string, any>;
}

// Agent lifecycle events
export type AgentEvent =
    | { type: 'agent_created'; agent: Agent }
    | { type: 'agent_updated'; agent: Agent }
    | { type: 'agent_deleted'; agentId: string }
    | { type: 'agent_invoked'; invocation: AgentInvocation }
    | { type: 'routing_performed'; routing: AgentRouting }
    | { type: 'routing_overridden'; routing: AgentRouting; actualAgent: string };
