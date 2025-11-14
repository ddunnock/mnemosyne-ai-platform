/**
 * Master Password Modal
 * Prompts user to unlock KeyManager with master password
 * FR-114: Master password validation and re-entry flow
 */

import { Modal, App, Notice, Setting } from 'obsidian';
import { KeyManager } from '../security/KeyManager';
import { EncryptionMetadata } from '../security/EncryptionService';

export class MasterPasswordModal extends Modal {
    private keyManager: KeyManager;
    private metadata: EncryptionMetadata | null;
    private onSuccess: (metadata?: EncryptionMetadata) => void;
    private onCancel?: () => void;
    private isFirstTime: boolean;
    private password = '';
    private confirmPassword = '';

    constructor(
        app: App,
        keyManager: KeyManager,
        metadata: EncryptionMetadata | null,
        onSuccess: (metadata?: EncryptionMetadata) => void,
        onCancel?: () => void
    ) {
        super(app);
        this.keyManager = keyManager;
        this.metadata = metadata;
        this.onSuccess = onSuccess;
        this.onCancel = onCancel;
        this.isFirstTime = metadata === null;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', {
            text: this.isFirstTime ? 'Set master password' : 'Unlock Mnemosyne'
        });

        if (this.isFirstTime) {
            contentEl.createDiv({
                text: 'Create a master password to encrypt your API keys. This password will not be stored and must be remembered.',
                cls: 'setting-item-description'
            });

            const warningDiv = contentEl.createDiv({
                text: '⚠️ Important: If you forget this password, you will need to re-enter all API keys.',
                cls: 'mod-warning'
            });
            warningDiv.style.marginTop = '8px';
            warningDiv.style.marginBottom = '16px';
        } else {
            contentEl.createDiv({
                text: 'Enter your master password to unlock encrypted API keys.',
                cls: 'setting-item-description'
            }).style.marginBottom = '16px';
        }

        // Password field
        new Setting(contentEl)
            .setName('Master password')
            .setDesc(this.isFirstTime ? 'At least 12 characters recommended' : 'Your master password')
            .addText(text => {
                text
                    .setPlaceholder('Enter password')
                    .setValue(this.password)
                    .onChange(value => this.password = value);
                text.inputEl.type = 'password';
                text.inputEl.style.width = '100%';

                // Focus the password field
                setTimeout(() => text.inputEl.focus(), 50);

                // Handle Enter key
                text.inputEl.addEventListener('keydown', async (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (this.isFirstTime && !this.confirmPassword) {
                            // Move to confirm password field
                            const confirmInput = contentEl.querySelector('#confirm-password-input') as HTMLInputElement;
                            confirmInput?.focus();
                        } else {
                            await this.handleUnlock();
                        }
                    }
                });
            });

        // Confirm password field (only for first time)
        if (this.isFirstTime) {
            new Setting(contentEl)
                .setName('Confirm password')
                .setDesc('Re-enter password to confirm')
                .addText(text => {
                    text
                        .setPlaceholder('Confirm password')
                        .setValue(this.confirmPassword)
                        .onChange(value => this.confirmPassword = value);
                    text.inputEl.type = 'password';
                    text.inputEl.style.width = '100%';
                    text.inputEl.id = 'confirm-password-input';

                    // Handle Enter key
                    text.inputEl.addEventListener('keydown', async (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            await this.handleUnlock();
                        }
                    });
                });
        }

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginTop = '20px';

        if (this.onCancel) {
            const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
            cancelButton.onclick = () => {
                this.onCancel?.();
                this.close();
            };
        }

        const unlockButton = buttonContainer.createEl('button', {
            text: this.isFirstTime ? 'Set password' : 'Unlock',
            cls: 'mod-cta'
        });
        unlockButton.onclick = async () => {
            await this.handleUnlock();
        };
    }

    private async handleUnlock() {
        try {
            // Validate input
            if (!this.password.trim()) {
                new Notice('Password cannot be empty');
                return;
            }

            if (this.isFirstTime) {
                // First time setup
                if (this.password.length < 8) {
                    new Notice('Password should be at least 8 characters');
                    return;
                }

                if (this.password !== this.confirmPassword) {
                    new Notice('Passwords do not match');
                    return;
                }

                if (this.password.length < 12) {
                    new Notice('Warning: Password is shorter than recommended (12 characters)', 5000);
                }

                // Create encryption metadata
                const metadata = await this.keyManager.createEncryptionMetadata(this.password);

                // Initialize key manager
                await this.keyManager.initializeWithPassword(this.password, metadata);

                new Notice('Master password set successfully');
                this.onSuccess(metadata);
                this.close();
            } else {
                // Unlock existing
                try {
                    await this.keyManager.initializeWithPassword(this.password, this.metadata!);
                    new Notice('Unlocked successfully');
                    this.onSuccess();
                    this.close();
                } catch (error) {
                    if (error instanceof Error && error.message.includes('Invalid master password')) {
                        new Notice('Incorrect password');
                        // Clear password field and refocus
                        this.password = '';
                        const passwordInput = this.contentEl.querySelector('input[type="password"]') as HTMLInputElement;
                        if (passwordInput) {
                            passwordInput.value = '';
                            passwordInput.focus();
                        }
                    } else {
                        new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }
        } catch (error) {
            new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Password Reset Modal
 * Allows user to reset master password (loses all encrypted keys)
 * FR-114: Master password reset flow
 */
export class ResetMasterPasswordModal extends Modal {
    private onConfirm: () => void;

    constructor(app: App, onConfirm: () => void) {
        super(app);
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Reset master password?' });

        contentEl.createDiv({
            text: 'This will delete all encrypted API keys. You will need to re-enter them after setting a new password.',
            cls: 'mod-warning'
        }).style.marginBottom = '16px';

        contentEl.createDiv({
            text: 'This action cannot be undone.',
            cls: 'setting-item-description'
        }).style.marginBottom = '20px';

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '8px';

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.onclick = () => this.close();

        const resetButton = buttonContainer.createEl('button', {
            text: 'Reset password',
            cls: 'mod-warning'
        });
        resetButton.onclick = () => {
            this.onConfirm();
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
