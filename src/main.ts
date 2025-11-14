import { Plugin, Notice, WorkspaceLeaf } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS } from './types/Settings';
import { MnemosyneSettingsTab } from './ui/SettingsTab';
import { ChatView, CHAT_VIEW_TYPE } from './ui/ChatView';
import { KeyManager } from './security/KeyManager';
import { ProviderManager } from './providers/ProviderManager';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { LocalProvider } from './providers/LocalProvider';
import { AgentManager } from './agents/AgentManager';
import { getLogger } from './utils/logger';

const logger = getLogger('AIAgentPlatform');

export default class AIAgentPlatformPlugin extends Plugin {
    settings!: PluginSettings;

    // Core Systems
    keyManager!: KeyManager;
    providerManager!: ProviderManager;
    agentManager!: AgentManager;

    // To be implemented in later phases:
    // orchestrator: AgentOrchestrator;
    // ragSystem: RAGSystem;
    // mcpManager: MCPManager;

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

            // Register views and UI elements
            this.registerViews();

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

        // Initialize Key Manager for encrypted API keys
        this.keyManager = new KeyManager();

        // Initialize Provider Manager and register providers
        this.providerManager = new ProviderManager(this.keyManager, this.app);
        this.providerManager.registerProvider(new OpenAIProvider());
        this.providerManager.registerProvider(new AnthropicProvider());
        this.providerManager.registerProvider(new LocalProvider());

        // Initialize providers with configurations
        for (const providerConfig of this.settings.providers) {
            if (providerConfig.enabled) {
                try {
                    await this.providerManager.initializeProvider(providerConfig);
                } catch (error) {
                    logger.error(`Failed to initialize provider ${providerConfig.id}:`, error);
                }
            }
        }

        // Initialize Agent Manager
        this.agentManager = new AgentManager(
            this.providerManager,
            this.settings.persona,
            this.app
        );

        // Load backend agents and custom agents (convert configs to agents)
        const customAgents = this.settings.agents.map(config => ({
            ...config,
            skillTags: config.skillTags || [],
            mcpTools: config.mcpToolPermissions || [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }));
        await this.agentManager.initialize(customAgents);

        // Load saved conversations
        const savedConversations = await this.loadConversations();
        this.agentManager.loadConversations(savedConversations);

        // Auto-archive old conversations
        this.agentManager.autoArchiveOldConversations(this.settings.conversation.autoArchiveDays);

        // Phase 4: RAG System (to be implemented)
        // this.ragSystem = new RAGSystem(this.settings.rag, this.app);
        // await this.ragSystem.initialize();

        // Phase 7: MCP Manager (to be implemented)
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

        // Quick chat command (FR-012)
        this.addCommand({
            id: 'open-chat',
            name: 'Open AI chat',
            callback: () => {
                this.activateChatView();
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
     * Register chat view
     */
    private registerViews(): void {
        this.registerView(
            CHAT_VIEW_TYPE,
            (leaf) => new ChatView(leaf, this.agentManager)
        );
    }

    /**
     * Activate chat view in right sidebar
     */
    async activateChatView(): Promise<void> {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);

        if (leaves.length > 0) {
            // View already exists, reveal it
            leaf = leaves[0];
        } else {
            // Create new view in right sidebar
            leaf = workspace.getRightLeaf(false);
            await leaf?.setViewState({ type: CHAT_VIEW_TYPE, active: true });
        }

        // Reveal the leaf
        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Clean up resources on plugin unload
     */
    private async cleanup(): Promise<void> {
        // Save conversations before unload
        await this.saveConversations();

        // Clear decrypted keys from memory
        if (this.keyManager) {
            this.keyManager.clearAllKeys();
        }

        // Clean up providers
        if (this.providerManager) {
            this.providerManager.cleanup();
        }

        // Save any pending data
        await this.saveSettings();

        logger.info('Cleanup completed');
    }

    /**
     * Load conversations from storage
     */
    private async loadConversations() {
        const data = await this.loadData();
        return data?.conversations || [];
    }

    /**
     * Save conversations to storage (FR-017, FR-018)
     */
    private async saveConversations() {
        if (!this.agentManager) return;

        const conversations = this.agentManager.exportConversations();
        const data = await this.loadData() || {};
        data.conversations = conversations;
        await this.saveData(data);
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