import { App } from 'obsidian';
import { AgentConfig } from '../../settings';
import { AgentError } from '../../utils/errors';
import { getLogger } from '../../utils/logger';
import { MnemosynePersona } from '../persona/MnemosynePersona';
import { BACKEND_AGENTS } from './BackendAgents';

const logger = getLogger('AgentManager');

export class AgentManager {
    private agents: Map<string, AgentConfig> = new Map();

    constructor(
        private userAgents: AgentConfig[],
        private persona: MnemosynePersona,
        private app: App
    ) {}

    /**
     * Initialize the agent manager with backend and user agents
     */
    async initialize(): Promise<void> {
        logger.info('Initializing Agent Manager...');

        // Load backend agents
        for (const agent of BACKEND_AGENTS) {
            this.agents.set(agent.id, agent);
        }
        logger.info(`Loaded ${BACKEND_AGENTS.length} backend agents`);

        // Load user agents
        for (const agent of this.userAgents) {
            this.agents.set(agent.id, agent);
        }
        logger.info(`Loaded ${this.userAgents.length} user agents`);

        logger.info(`Total agents available: ${this.agents.size}`);
    }

    /**
     * Add a new agent
     */
    addAgent(config: AgentConfig): void {
        if (this.agents.has(config.id)) {
            throw new AgentError(`Agent with ID '${config.id}' already exists`, config.id);
        }

        this.agents.set(config.id, config);
        logger.info(`Added agent: ${config.name} (${config.id})`);
    }

    /**
     * Update an existing agent
     */
    updateAgent(id: string, updates: Partial<AgentConfig>): void {
        const agent = this.agents.get(id);

        if (!agent) {
            throw new AgentError(`Agent '${id}' not found`, id);
        }

        if (agent.isBackend && !agent.canDelete) {
            throw new AgentError(`Cannot modify backend agent '${id}'`, id);
        }

        const updated = { ...agent, ...updates };
        this.agents.set(id, updated);
        logger.info(`Updated agent: ${id}`);
    }

    /**
     * Delete an agent
     */
    deleteAgent(id: string): boolean {
        const agent = this.agents.get(id);

        if (!agent) {
            logger.warn(`Attempted to delete non-existent agent: ${id}`);
            return false;
        }

        if (!agent.canDelete) {
            throw new AgentError(`Cannot delete protected agent '${id}'`, id);
        }

        this.agents.delete(id);
        logger.info(`Deleted agent: ${id}`);
        return true;
    }

    /**
     * Get an agent by ID
     */
    getAgent(id: string): AgentConfig | undefined {
        return this.agents.get(id);
    }

    /**
     * Get all agents
     */
    getAllAgents(): AgentConfig[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get backend agents only
     */
    getBackendAgents(): AgentConfig[] {
        return Array.from(this.agents.values()).filter(a => a.isBackend);
    }

    /**
     * Get user-created custom agents
     */
    getCustomAgents(): AgentConfig[] {
        return Array.from(this.agents.values()).filter(a => !a.isBackend);
    }

    /**
     * Get an agent's system prompt with persona applied if enabled
     */
    getAgentSystemPrompt(id: string): string {
        const agent = this.agents.get(id);

        if (!agent) {
            throw new AgentError(`Agent '${id}' not found`, id);
        }

        // Apply Mnemosyne persona if enabled
        return this.persona.applyToSystemPrompt(agent.systemPrompt);
    }

    /**
     * Check if an agent exists
     */
    hasAgent(id: string): boolean {
        return this.agents.has(id);
    }

    /**
     * Get agent count
     */
    getAgentCount(): number {
        return this.agents.size;
    }

    /**
     * Export agents to JSON
     */
    exportAgents(includeBackend: boolean = false): string {
        const agents = includeBackend
            ? this.getAllAgents()
            : this.getCustomAgents();

        return JSON.stringify(agents, null, 2);
    }

    /**
     * Import agents from JSON
     */
    importAgents(json: string): number {
        try {
            const agents = JSON.parse(json) as AgentConfig[];
            let imported = 0;

            for (const agent of agents) {
                if (!this.agents.has(agent.id)) {
                    this.addAgent(agent);
                    imported++;
                }
            }

            logger.info(`Imported ${imported} agents`);
            return imported;
        } catch (error) {
            throw new AgentError(
                `Failed to import agents: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'import'
            );
        }
    }
}