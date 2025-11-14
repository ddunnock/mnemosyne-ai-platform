/**
 * Encryption Service
 * Uses SubtleCrypto with AES-256-GCM and PBKDF2 key derivation
 * Constitution Requirement II: SubtleCrypto for mobile compatibility
 */

import { createProviderError } from '../utils/ErrorHandling';

export class EncryptionService {
    private static readonly ALGORITHM = 'AES-GCM';
    private static readonly KEY_LENGTH = 256;
    private static readonly SALT_LENGTH = 16;
    private static readonly IV_LENGTH = 12;
    private static readonly ITERATIONS = 100000; // PBKDF2 iterations (FR-042)
    private static readonly TAG_LENGTH = 128; // GCM authentication tag length

    /**
     * Derive a cryptographic key from a master password
     * FR-042: PBKDF2 with 100,000 iterations
     */
    async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        try {
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);

            // Import the password as key material
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            // Derive the encryption key using PBKDF2
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt as BufferSource,
                    iterations: EncryptionService.ITERATIONS,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: EncryptionService.ALGORITHM,
                    length: EncryptionService.KEY_LENGTH
                },
                false,
                ['encrypt', 'decrypt']
            );

            return key;
        } catch (error) {
            throw createProviderError(
                `Failed to derive key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'KEY_DERIVATION_FAILED'
            );
        }
    }

    /**
     * Encrypt data using AES-256-GCM
     * FR-041: AES-256 encryption
     */
    async encrypt(plaintext: string, key: CryptoKey): Promise<EncryptedData> {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(plaintext);

            // Generate random IV
            const iv = crypto.getRandomValues(new Uint8Array(EncryptionService.IV_LENGTH));

            // Encrypt the data
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: EncryptionService.ALGORITHM,
                    iv: iv,
                    tagLength: EncryptionService.TAG_LENGTH
                },
                key,
                data
            );

            return {
                ciphertext: this.arrayBufferToBase64(ciphertext),
                iv: this.uint8ArrayToBase64(iv),
                algorithm: EncryptionService.ALGORITHM,
                tagLength: EncryptionService.TAG_LENGTH
            };
        } catch (error) {
            throw createProviderError(
                `Failed to encrypt: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'ENCRYPTION_FAILED'
            );
        }
    }

    /**
     * Decrypt data using AES-256-GCM
     * FR-045: Clear from memory after use (caller responsibility)
     */
    async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
        try {
            const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
            const iv = this.base64ToUint8Array(encryptedData.iv);

            // Decrypt the data
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: encryptedData.algorithm,
                    iv: iv,
                    tagLength: encryptedData.tagLength
                },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            throw createProviderError(
                `Failed to decrypt: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DECRYPTION_FAILED'
            );
        }
    }

    /**
     * Generate a random salt for key derivation
     */
    generateSalt(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(EncryptionService.SALT_LENGTH));
    }

    /**
     * Validate that a password can unlock encrypted data
     */
    async validatePassword(
        password: string,
        salt: Uint8Array,
        testData: EncryptedData
    ): Promise<boolean> {
        try {
            const key = await this.deriveKey(password, salt);
            await this.decrypt(testData, key);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Generate a test encrypted string for password validation
     */
    async createPasswordTest(password: string, salt: Uint8Array): Promise<EncryptedData> {
        const key = await this.deriveKey(password, salt);
        return this.encrypt('mnemosyne-test', key);
    }

    // Utility methods for base64 encoding/decoding

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
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

/**
 * Encrypted data structure
 */
export interface EncryptedData {
    ciphertext: string;  // Base64 encoded
    iv: string;          // Base64 encoded initialization vector
    algorithm: string;
    tagLength: number;
}

/**
 * Encryption metadata stored in plugin settings
 */
export interface EncryptionMetadata {
    salt: string;        // Base64 encoded salt
    testData: EncryptedData;  // Test data for password validation
    version: string;     // Encryption version for future migrations
}
