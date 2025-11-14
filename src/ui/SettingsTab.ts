/**
 * Settings Tab
 * Main settings interface for the AI Agent Platform
 * Constitution Requirement VI: Sentence case, setHeading() API, Obsidian CSS variables
 */

import { App, PluginSettingTab, Setting, Modal, Notice } from 'obsidian';
import type AIAgentPlatformPlugin from '../main';
import { PluginSettings, ProviderConfig } from '../types/Settings';
import { EncryptionMetadata } from '../security/EncryptionService';

export class MnemosyneSettingsTab extends PluginSettingTab {
    plugin: AIAgentPlatformPlugin;

    constructor(app: App, plugin: AIAgentPlatformPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Main heading
        containerEl.createEl('h1', { text: 'Mnemosyne AI Platform' });

        // Provider Settings
        this.displayProviderSettings(containerEl);

        // Agent Settings
        this.displayAgentSettings(containerEl);

        // RAG Settings
        this.displayRAGSettings(containerEl);

        // MCP Settings
        this.displayMCPSettings(containerEl);

        // Persona Settings
        this.displayPersonaSettings(containerEl);

        // Conversation Settings
        this.displayConversationSettings(containerEl);
    }

    private displayProviderSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Provider settings' });

        new Setting(containerEl)
            .setName('Configured providers')
            .setDesc('Add and manage LLM providers (OpenAI, Anthropic, local).')
            .addButton(button => button
                .setButtonText('Add provider')
                .onClick(() => {
                    new ProviderConfigModal(this.app, this.plugin, null, async (config) => {
                        this.plugin.settings.providers.push(config);
                        await this.plugin.saveSettings();
                        this.display();
                    }).open();
                }));

        // List existing providers
        if (this.plugin.settings.providers.length === 0) {
            containerEl.createEl('p', {
                text: 'No providers configured. Add a provider to start using AI agents.',
                cls: 'setting-item-description'
            });
        } else {
            this.plugin.settings.providers.forEach((provider, index) => {
                new Setting(containerEl)
                    .setName(provider.name)
                    .setDesc(`Type: ${provider.type} | Model: ${provider.model || 'default'} | Enabled: ${provider.enabled ? 'Yes' : 'No'}`)
                    .addButton(button => button
                        .setButtonText('Test')
                        .onClick(async () => {
                            button.setDisabled(true);
                            button.setButtonText('Testing...');
                            try {
                                const result = await this.plugin.providerManager.validateProvider(provider);
                                if (result.valid) {
                                    new Notice('Provider validated successfully!');
                                } else {
                                    new Notice(`Validation failed: ${result.error}`);
                                }
                            } catch (error) {
                                new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            } finally {
                                button.setDisabled(false);
                                button.setButtonText('Test');
                            }
                        }))
                    .addButton(button => button
                        .setButtonText('Edit')
                        .onClick(() => {
                            new ProviderConfigModal(this.app, this.plugin, provider, async (updatedConfig) => {
                                this.plugin.settings.providers[index] = updatedConfig;
                                await this.plugin.saveSettings();
                                this.display();
                            }).open();
                        }))
                    .addButton(button => button
                        .setButtonText('Remove')
                        .setWarning()
                        .onClick(async () => {
                            this.plugin.settings.providers.splice(index, 1);
                            await this.plugin.saveSettings();
                            this.display();
                        }));
            });
        }
    }

    private displayAgentSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Agent settings' });

        new Setting(containerEl)
            .setName('Backend agents')
            .setDesc('Pre-configured expert agents (cannot be deleted).');

        new Setting(containerEl)
            .setName('Custom agents')
            .setDesc('Create your own specialized agents with custom prompts.')
            .addButton(button => button
                .setButtonText('Create custom agent')
                .onClick(() => {
                    // Will be implemented in Phase 5
                    console.log('Create custom agent clicked');
                }));

        // List custom agents
        const customAgents = this.plugin.settings.agents.filter(a => !a.isBackend);
        if (customAgents.length === 0) {
            containerEl.createEl('p', {
                text: 'No custom agents created yet.',
                cls: 'setting-item-description'
            });
        } else {
            customAgents.forEach(agent => {
                new Setting(containerEl)
                    .setName(agent.name)
                    .setDesc(agent.description)
                    .addButton(button => button
                        .setButtonText('Edit')
                        .onClick(() => {
                            console.log('Edit agent:', agent.id);
                        }))
                    .addButton(button => button
                        .setButtonText('Delete')
                        .setWarning()
                        .onClick(() => {
                            console.log('Delete agent:', agent.id);
                        }));
            });
        }
    }

    private displayRAGSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'RAG settings' });

        new Setting(containerEl)
            .setName('Enable RAG')
            .setDesc('Allow agents to access your vault notes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rag.enabled)
                .onChange(async (value) => {
                    this.plugin.settings.rag.enabled = value;
                    await this.plugin.saveSettings();
                    this.display();  // Refresh to show/hide RAG options
                }));

        if (!this.plugin.settings.rag.enabled) {
            return;
        }

        new Setting(containerEl)
            .setName('Vector store backend')
            .setDesc('Storage backend for embeddings. Auto-detects best option for your platform.')
            .addDropdown(dropdown => dropdown
                .addOption('auto', 'Auto (recommended)')
                .addOption('sqlite', 'SQLite (desktop only)')
                .addOption('indexeddb', 'IndexedDB (mobile)')
                .addOption('json', 'JSON (fallback)')
                .setValue(this.plugin.settings.rag.backend)
                .onChange(async (value: any) => {
                    this.plugin.settings.rag.backend = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Embedding provider')
            .setDesc('Service for generating embeddings.')
            .addDropdown(dropdown => dropdown
                .addOption('openai', 'OpenAI (text-embedding-3-small)')
                .addOption('local', 'Local (Transformers.js)')
                .setValue(this.plugin.settings.rag.embeddingProvider)
                .onChange(async (value: any) => {
                    this.plugin.settings.rag.embeddingProvider = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-index vault')
            .setDesc('Automatically index your vault notes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rag.autoIndex)
                .onChange(async (value) => {
                    this.plugin.settings.rag.autoIndex = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Index conversations')
            .setDesc('Index conversation history for long-term memory.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.rag.indexConversations)
                .onChange(async (value) => {
                    this.plugin.settings.rag.indexConversations = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default top-K results')
            .setDesc('Number of results to retrieve by default.')
            .addText(text => text
                .setPlaceholder('5')
                .setValue(String(this.plugin.settings.rag.defaultTopK))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.rag.defaultTopK = num;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Start indexing')
            .setDesc('Index all markdown files in your vault.')
            .addButton(button => button
                .setButtonText('Index vault')
                .onClick(() => {
                    // Will be implemented in Phase 4
                    console.log('Start indexing clicked');
                }));
    }

    private displayMCPSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'MCP settings' });

        new Setting(containerEl)
            .setName('Enable MCP tools')
            .setDesc('Allow agents to read, search, and modify notes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.mcp.enabled)
                .onChange(async (value) => {
                    this.plugin.settings.mcp.enabled = value;
                    await this.plugin.saveSettings();
                    this.display();  // Refresh to show/hide MCP options
                }));

        if (!this.plugin.settings.mcp.enabled) {
            return;
        }

        new Setting(containerEl)
            .setName('Read-only mode')
            .setDesc('Prevent agents from making any changes to notes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.mcp.readOnly)
                .onChange(async (value) => {
                    this.plugin.settings.mcp.readOnly = value;
                    await this.plugin.saveSettings();
                    this.display();  // Refresh
                }));

        new Setting(containerEl)
            .setName('Read tools')
            .setDesc('Allow agents to read note content.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.mcp.readToolsEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.mcp.readToolsEnabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Search tools')
            .setDesc('Allow agents to search notes by keywords, tags, and backlinks.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.mcp.searchToolsEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.mcp.searchToolsEnabled = value;
                    await this.plugin.saveSettings();
                }));

        if (!this.plugin.settings.mcp.readOnly) {
            new Setting(containerEl)
                .setName('Write tools')
                .setDesc('Allow agents to create and modify notes (requires confirmation).')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.mcp.writeToolsEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.mcp.writeToolsEnabled = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Metadata tools')
                .setDesc('Allow agents to update note frontmatter (requires confirmation).')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.mcp.metadataToolsEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.mcp.metadataToolsEnabled = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Require confirmation')
                .setDesc('Show confirmation prompt before any write operation.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.mcp.requireConfirmation)
                    .onChange(async (value) => {
                        this.plugin.settings.mcp.requireConfirmation = value;
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName('Audit logging')
            .setDesc('Log all tool executions with timestamps and details.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.mcp.auditLogEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.mcp.auditLogEnabled = value;
                    await this.plugin.saveSettings();
                }));
    }

    private displayPersonaSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Persona settings' });

        new Setting(containerEl)
            .setName('Enable Mnemosyne persona')
            .setDesc('Add a personality layer with timeless wisdom theming.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.persona.enabled)
                .onChange(async (value) => {
                    this.plugin.settings.persona.enabled = value;
                    await this.plugin.saveSettings();
                    this.display();  // Refresh
                }));

        if (!this.plugin.settings.persona.enabled) {
            return;
        }

        new Setting(containerEl)
            .setName('Persona intensity')
            .setDesc('How strongly the persona influences responses.')
            .addDropdown(dropdown => dropdown
                .addOption('subtle', 'Subtle')
                .addOption('moderate', 'Moderate')
                .addOption('strong', 'Strong')
                .setValue(this.plugin.settings.persona.intensity)
                .onChange(async (value: any) => {
                    this.plugin.settings.persona.intensity = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Custom additions')
            .setDesc('Add your own custom persona elements.')
            .addTextArea(text => text
                .setPlaceholder('Enter custom persona additions...')
                .setValue(this.plugin.settings.persona.customPromptAddition || '')
                .onChange(async (value) => {
                    this.plugin.settings.persona.customPromptAddition = value;
                    await this.plugin.saveSettings();
                }));
    }

    private displayConversationSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Conversation settings' });

        new Setting(containerEl)
            .setName('Maximum conversations')
            .setDesc('Maximum number of conversations to keep in active list.')
            .addText(text => text
                .setPlaceholder('100')
                .setValue(String(this.plugin.settings.conversation.maxConversations))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.conversation.maxConversations = num;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Auto-archive after days')
            .setDesc('Automatically archive conversations after this many days of inactivity.')
            .addText(text => text
                .setPlaceholder('30')
                .setValue(String(this.plugin.settings.conversation.autoArchiveDays))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.conversation.autoArchiveDays = num;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Messages before compression')
            .setDesc('Trigger context compression after this many messages.')
            .addText(text => text
                .setPlaceholder('50')
                .setValue(String(this.plugin.settings.conversation.maxMessagesBeforeCompression))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.conversation.maxMessagesBeforeCompression = num;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Compression strategy')
            .setDesc('How to handle context when approaching limits.')
            .addDropdown(dropdown => dropdown
                .addOption('summarize', 'Summarize (preserve key information)')
                .addOption('truncate', 'Truncate (remove oldest messages)')
                .addOption('sliding-window', 'Sliding window (keep recent messages)')
                .setValue(this.plugin.settings.conversation.compressionStrategy)
                .onChange(async (value: any) => {
                    this.plugin.settings.conversation.compressionStrategy = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show timestamps')
            .setDesc('Display message timestamps in chat.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.conversation.showTimestamps)
                .onChange(async (value) => {
                    this.plugin.settings.conversation.showTimestamps = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show source citations')
            .setDesc('Display source notes when RAG is used.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.conversation.showSourceCitations)
                .onChange(async (value) => {
                    this.plugin.settings.conversation.showSourceCitations = value;
                    await this.plugin.saveSettings();
                }));
    }
}

/**
 * Provider Configuration Modal
 * FR-003, FR-004: API key validation with master password
 */
class ProviderConfigModal extends Modal {
    private plugin: AIAgentPlatformPlugin;
    private existingConfig: ProviderConfig | null;
    private onSave: (config: ProviderConfig) => void;

    private providerType: 'openai' | 'anthropic' | 'local' = 'openai';
    private providerName = '';
    private apiKey = '';
    private endpoint = '';
    private model = '';

    constructor(
        app: App,
        plugin: AIAgentPlatformPlugin,
        existingConfig: ProviderConfig | null,
        onSave: (config: ProviderConfig) => void
    ) {
        super(app);
        this.plugin = plugin;
        this.existingConfig = existingConfig;
        this.onSave = onSave;

        if (existingConfig) {
            this.providerType = existingConfig.type;
            this.providerName = existingConfig.name;
            this.endpoint = existingConfig.endpoint || '';
            this.model = existingConfig.model || '';
        }
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.existingConfig ? 'Edit provider' : 'Add provider' });

        // Provider Type
        new Setting(contentEl)
            .setName('Provider type')
            .setDesc('Select the LLM provider')
            .addDropdown(dropdown => dropdown
                .addOption('openai', 'OpenAI')
                .addOption('anthropic', 'Anthropic')
                .addOption('local', 'Local LLM')
                .setValue(this.providerType)
                .onChange((value: any) => {
                    this.providerType = value;
                    this.updateUI();
                }));

        // Provider Name
        new Setting(contentEl)
            .setName('Provider name')
            .setDesc('A friendly name for this provider')
            .addText(text => text
                .setPlaceholder('My OpenAI Provider')
                .setValue(this.providerName)
                .onChange(value => this.providerName = value));

        // API Key
        if (this.providerType !== 'local' || this.existingConfig) {
            new Setting(contentEl)
                .setName('API key')
                .setDesc('Your provider API key (encrypted with master password)')
                .addText(text => {
                    text
                        .setPlaceholder('sk-...')
                        .setValue(this.apiKey)
                        .onChange(value => this.apiKey = value);
                    text.inputEl.type = 'password';
                });
        }

        // Endpoint (for local providers)
        if (this.providerType === 'local') {
            new Setting(contentEl)
                .setName('Endpoint URL')
                .setDesc('Local LLM endpoint (e.g., http://localhost:1234/v1)')
                .addText(text => text
                    .setPlaceholder('http://localhost:1234/v1')
                    .setValue(this.endpoint)
                    .onChange(value => this.endpoint = value));
        }

        // Model
        new Setting(contentEl)
            .setName('Model')
            .setDesc('Default model to use (optional)')
            .addText(text => text
                .setPlaceholder(this.getDefaultModelPlaceholder())
                .setValue(this.model)
                .onChange(value => this.model = value));

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginTop = '20px';

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.onclick = () => this.close();

        const saveButton = buttonContainer.createEl('button', {
            text: 'Save',
            cls: 'mod-cta'
        });
        saveButton.onclick = async () => {
            await this.handleSave();
        };
    }

    private getDefaultModelPlaceholder(): string {
        switch (this.providerType) {
            case 'openai':
                return 'gpt-4-turbo-preview';
            case 'anthropic':
                return 'claude-3-5-sonnet-20241022';
            case 'local':
                return 'local-model';
            default:
                return '';
        }
    }

    private updateUI() {
        this.onOpen();
    }

    private async handleSave() {
        // Validate inputs
        if (!this.providerName.trim()) {
            new Notice('Provider name is required');
            return;
        }

        if (this.providerType === 'local' && !this.endpoint.trim()) {
            new Notice('Endpoint URL is required for local providers');
            return;
        }

        // Encrypt API key if provided
        let encryptedApiKey: string | undefined;
        if (this.apiKey.trim()) {
            try {
                // Check if master password is set
                if (!this.plugin.keyManager.isUnlocked()) {
                    new Notice('Master password required. Please set up encryption first.');
                    return;
                }

                const encrypted = await this.plugin.keyManager.encryptKey(
                    this.existingConfig?.id || crypto.randomUUID(),
                    this.apiKey
                );
                encryptedApiKey = JSON.stringify(encrypted);
            } catch (error) {
                new Notice(`Failed to encrypt API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return;
            }
        }

        const config: ProviderConfig = {
            id: this.existingConfig?.id || crypto.randomUUID(),
            name: this.providerName,
            type: this.providerType,
            apiKey: encryptedApiKey || this.existingConfig?.apiKey,
            endpoint: this.endpoint || undefined,
            model: this.model || undefined,
            enabled: true
        };

        this.onSave(config);
        this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
