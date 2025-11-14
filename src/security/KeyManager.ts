/**
 * Key Manager
 * Manages encrypted API key storage with master password
 * FR-043, FR-044, FR-045: Encrypted storage, in-memory decryption, clear after use
 */

import { EncryptionService, EncryptedData, EncryptionMetadata } from './EncryptionService';
import { createProviderError } from '../utils/ErrorHandling';

export class KeyManager {
    private encryptionService: EncryptionService;
    private masterKey: CryptoKey | null = null;
    private decryptedKeys: Map<string, string> = new Map();
    private keyTimeout: Map<string, NodeJS.Timeout> = new Map();
    private static readonly KEY_LIFETIME_MS = 300000; // 5 minutes

    constructor() {
        this.encryptionService = new EncryptionService();
    }

    /**
     * Initialize with master password
     * FR-042: Master password required
     */
    async initializeWithPassword(
        password: string,
        metadata?: EncryptionMetadata
    ): Promise<void> {
        try {
            if (metadata) {
                // Validate password with existing metadata
                const salt = this.base64ToUint8Array(metadata.salt);
                const isValid = await this.encryptionService.validatePassword(
                    password,
                    salt,
                    metadata.testData
                );

                if (!isValid) {
                    throw createProviderError(
                        'Invalid master password',
                        'INVALID_PASSWORD'
                    );
                }

                this.masterKey = await this.encryptionService.deriveKey(password, salt);
            } else {
                // Create new encryption metadata
                const salt = this.encryptionService.generateSalt();
                this.masterKey = await this.encryptionService.deriveKey(password, salt);
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('Invalid master password')) {
                throw error;
            }
            throw createProviderError(
                `Failed to initialize key manager: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'INITIALIZATION_FAILED'
            );
        }
    }

    /**
     * Create encryption metadata for first-time setup
     */
    async createEncryptionMetadata(password: string): Promise<EncryptionMetadata> {
        const salt = this.encryptionService.generateSalt();
        const testData = await this.encryptionService.createPasswordTest(password, salt);

        return {
            salt: this.uint8ArrayToBase64(salt),
            testData,
            version: '1.0'
        };
    }

    /**
     * Encrypt an API key for storage
     * FR-043: No plain text storage
     */
    async encryptKey(providerId: string, apiKey: string): Promise<EncryptedData> {
        if (!this.masterKey) {
            throw createProviderError(
                'Master key not initialized',
                'NO_MASTER_KEY'
            );
        }

        return this.encryptionService.encrypt(apiKey, this.masterKey);
    }

    /**
     * Decrypt an API key for use
     * FR-044: In-memory decryption only
     * FR-045: Clear after use with automatic timeout
     */
    async decryptKey(providerId: string, encryptedKey: EncryptedData): Promise<string> {
        if (!this.masterKey) {
            throw createProviderError(
                'Master key not initialized',
                'NO_MASTER_KEY'
            );
        }

        // Check if key is already decrypted in memory
        if (this.decryptedKeys.has(providerId)) {
            this.resetKeyTimeout(providerId);
            return this.decryptedKeys.get(providerId)!;
        }

        // Decrypt the key
        const decryptedKey = await this.encryptionService.decrypt(encryptedKey, this.masterKey);

        // Store in memory with timeout
        this.decryptedKeys.set(providerId, decryptedKey);
        this.setKeyTimeout(providerId);

        return decryptedKey;
    }

    /**
     * Get a decrypted key (if available in memory)
     */
    getDecryptedKey(providerId: string): string | null {
        if (this.decryptedKeys.has(providerId)) {
            this.resetKeyTimeout(providerId);
            return this.decryptedKeys.get(providerId)!;
        }
        return null;
    }

    /**
     * Clear a specific key from memory
     * FR-045: Explicit memory cleanup
     */
    clearKey(providerId: string): void {
        if (this.decryptedKeys.has(providerId)) {
            // Overwrite with zeros before deleting
            const key = this.decryptedKeys.get(providerId)!;
            this.decryptedKeys.set(providerId, '0'.repeat(key.length));
            this.decryptedKeys.delete(providerId);
        }

        if (this.keyTimeout.has(providerId)) {
            clearTimeout(this.keyTimeout.get(providerId)!);
            this.keyTimeout.delete(providerId);
        }
    }

    /**
     * Clear all keys from memory
     */
    clearAllKeys(): void {
        for (const providerId of this.decryptedKeys.keys()) {
            this.clearKey(providerId);
        }
    }

    /**
     * Lock the key manager (clear master key and all decrypted keys)
     */
    lock(): void {
        this.clearAllKeys();
        this.masterKey = null;
    }

    /**
     * Check if master key is available
     */
    isUnlocked(): boolean {
        return this.masterKey !== null;
    }

    /**
     * Validate a password against stored metadata
     */
    async validatePassword(password: string, metadata: EncryptionMetadata): Promise<boolean> {
        try {
            const salt = this.base64ToUint8Array(metadata.salt);
            return await this.encryptionService.validatePassword(
                password,
                salt,
                metadata.testData
            );
        } catch {
            return false;
        }
    }

    /**
     * Change master password (re-encrypt all keys)
     */
    async changeMasterPassword(
        oldPassword: string,
        newPassword: string,
        metadata: EncryptionMetadata,
        encryptedKeys: Map<string, EncryptedData>
    ): Promise<{ metadata: EncryptionMetadata; keys: Map<string, EncryptedData> }> {
        // Validate old password
        const isValid = await this.validatePassword(oldPassword, metadata);
        if (!isValid) {
            throw createProviderError(
                'Invalid old password',
                'INVALID_PASSWORD'
            );
        }

        // Initialize with old password to decrypt keys
        await this.initializeWithPassword(oldPassword, metadata);

        // Decrypt all keys
        const decryptedKeys = new Map<string, string>();
        for (const [providerId, encryptedKey] of encryptedKeys) {
            const decrypted = await this.encryptionService.decrypt(encryptedKey, this.masterKey!);
            decryptedKeys.set(providerId, decrypted);
        }

        // Create new encryption metadata
        const newMetadata = await this.createEncryptionMetadata(newPassword);

        // Re-initialize with new password
        await this.initializeWithPassword(newPassword, newMetadata);

        // Re-encrypt all keys
        const newEncryptedKeys = new Map<string, EncryptedData>();
        for (const [providerId, decrypted] of decryptedKeys) {
            const encrypted = await this.encryptionService.encrypt(decrypted, this.masterKey!);
            newEncryptedKeys.set(providerId, encrypted);
        }

        return {
            metadata: newMetadata,
            keys: newEncryptedKeys
        };
    }

    // Private helper methods

    private setKeyTimeout(providerId: string): void {
        const timeout = setTimeout(() => {
            this.clearKey(providerId);
        }, KeyManager.KEY_LIFETIME_MS);

        this.keyTimeout.set(providerId, timeout);
    }

    private resetKeyTimeout(providerId: string): void {
        if (this.keyTimeout.has(providerId)) {
            clearTimeout(this.keyTimeout.get(providerId)!);
            this.setKeyTimeout(providerId);
        }
    }

    private uint8ArrayToBase64(array: Uint8Array): string {
        let binary = '';
        for (let i = 0; i < array.byteLength; i++) {
            binary += String.fromCharCode(array[i]);
        }
        return btoa(binary);
    }

    private base64ToUint8Array(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}
