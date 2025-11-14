import { Plugin, Notice } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS } from './types/Settings';
import { MnemosyneSettingsTab } from './ui/SettingsTab';
import { getLogger } from './utils/logger';

// Core managers will be implemented in later phases
// import { LLMManager } from './core/llm/LLMManager';
// import { AgentManager } from './core/agents/AgentManager';
// import { AgentOrchestrator } from './core/orchestrator/AgentOrchestrator';
// import { MnemosynePersona } from './core/persona/MnemosynePersona';

const logger = getLogger('AIAgentPlatform');

export default class AIAgentPlatformPlugin extends Plugin {
    settings!: PluginSettings;

    // Core Systems (to be implemented in later phases)
    // llmManager: LLMManager;
    // agentManager: AgentManager;
    // orchestrator: AgentOrchestrator;
    // persona: MnemosynePersona;
    // ragSystem: RAGSystem;
    // mcpManager: MCPManager;
    // memoryManager: MemoryManager;

    async onload() {
        logger.info('Loading AI Agent Platform Plugin v2.0.0');

        try {
            // Load settings
            await this.loadSettings();

            // Register settings tab
            this.addSettingTab(new MnemosyneSettingsTab(this.app, this));

            // Use workspace.onLayoutReady for deferred initialization (Constitution V)
            this.app.workspace.onLayoutReady(async () => {
                await this.initializeSystems();
            });

            // Register commands
            this.registerCommands();

            // Register views and UI elements (will be implemented in Phase 3)
            // this.registerViews();

            // Register event handlers
            this.registerEventHandlers();

            logger.info('AI Agent Platform Plugin loaded successfully');

            // Show welcome notice
            if (this.settings.persona.enabled) {
                new Notice(`Mnemosyne awakens to serve your vault (${this.settings.persona.intensity} presence)`);
            } else {
                new Notice('AI Agent Platform loaded successfully');
            }

        } catch (error) {
            logger.error('Failed to load plugin:', error);
            new Notice('Failed to load AI Agent Platform. Check console for details.');
        }
    }

    async onunload() {
        logger.info('Unloading AI Agent Platform Plugin');

        try {
            // Clean up resources
            await this.cleanup();

            logger.info('AI Agent Platform Plugin unloaded successfully');

        } catch (error) {
            logger.error('Error during plugin unload:', error);
        }
    }

    /**
     * Initialize all core systems (deferred via workspace.onLayoutReady)
     * Constitution Requirement V: Non-critical operations deferred for performance
     */
    private async initializeSystems(): Promise<void> {
        logger.info('Initializing core systems (deferred)...');

        // Core systems will be initialized in later phases
        // Phase 3: LLM Manager, Agent Manager, Persona
        // Phase 4: RAG System
        // Phase 7: MCP Manager

        // Example initialization (to be implemented):
        // this.persona = new MnemosynePersona(this.settings.persona);
        // this.llmManager = new LLMManager(this.settings.providers, this.app);
        // await this.llmManager.initialize();
        // this.agentManager = new AgentManager(this.settings.agents, this.persona, this.app);
        // await this.agentManager.initialize();
        // this.orchestrator = new AgentOrchestrator(this.agentManager, this.llmManager, this.app);
        // this.ragSystem = new RAGSystem(this.settings.rag, this.app);
        // await this.ragSystem.initialize();
        // this.mcpManager = new MCPManager(this.settings.mcp, this.app);
        // await this.mcpManager.initialize();

        logger.info('Core systems initialized successfully');
    }

    /**
     * Register all plugin commands
     */
    private registerCommands(): void {
        logger.info('Registering commands...');

        // Test command for development
        this.addCommand({
            id: 'test-plugin',
            name: 'Test: Show Plugin Status',
            callback: () => {
                const status = this.getPluginStatus();
                new Notice(status);
                logger.info(status);
            }
        });

        // Toggle Mnemosyne Persona
        this.addCommand({
            id: 'toggle-persona',
            name: 'Toggle Mnemosyne persona',
            callback: async () => {
                this.settings.persona.enabled = !this.settings.persona.enabled;
                // this.persona.updateConfig(this.settings.persona);
                await this.saveSettings();

                const message = this.settings.persona.enabled
                    ? `Mnemosyne awakens (${this.settings.persona.intensity} presence)`
                    : 'Mnemosyne persona deactivated';

                new Notice(message);
            }
        });

        // Quick chat command
        this.addCommand({
            id: 'open-chat',
            name: 'Open AI chat',
            callback: () => {
                // Will implement in Phase 3 (User Story 1)
                new Notice('Chat interface coming in Phase 3');
            }
        });

        // More commands will be added in later phases
        logger.info('Commands registered successfully');
    }

    /**
     * Register event handlers for vault changes
     */
    private registerEventHandlers(): void {
        logger.info('Registering event handlers...');

        // Listen for file changes for RAG indexing (Phase 2)
        // this.registerEvent(
        //   this.app.vault.on('modify', (file) => {
        //     this.ragSystem.handleFileChange(file);
        //   })
        // );

        logger.info('Event handlers registered successfully');
    }

    /**
     * Clean up resources on plugin unload
     */
    private async cleanup(): Promise<void> {
        // Close database connections
        // if (this.ragSystem) {
        //   await this.ragSystem.close();
        // }

        // Save any pending data
        await this.saveSettings();

        logger.info('Cleanup completed');
    }

    /**
     * Get current plugin status for debugging
     */
    private getPluginStatus(): string {
        const providers = this.settings.providers.length;
        const agents = this.settings.agents.length;
        const personaStatus = this.settings.persona.enabled
            ? `Persona: ${this.settings.persona.intensity}`
            : 'Persona: disabled';

        return `AI Agent Platform Status:
- Providers: ${providers}
- Agents: ${agents}
- ${personaStatus}
- Version: 2.0.0`;
    }

    /**
     * Load plugin settings
     */
    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
        logger.debug('Settings loaded');
    }

    /**
     * Save plugin settings
     */
    async saveSettings() {
        await this.saveData(this.settings);
        logger.debug('Settings saved');
    }

    /**
     * Update persona configuration
     */
    updatePersona(enabled: boolean, intensity?: 'none' | 'subtle' | 'moderate' | 'strong'): void {
        this.settings.persona.enabled = enabled;
        if (intensity) {
            this.settings.persona.intensity = intensity;
        }
        // this.persona.updateConfig(this.settings.persona);
        this.saveSettings();
    }
}