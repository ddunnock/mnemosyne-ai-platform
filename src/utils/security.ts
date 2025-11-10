import { EncryptionError } from './errors';

/**
 * Security Manager for encrypting/decrypting API keys
 * Uses Web Crypto API for browser compatibility
 */
export class SecurityManager {
    private static readonly ALGORITHM = 'AES-GCM';
    private static readonly KEY_LENGTH = 256;
    private static readonly SALT_LENGTH = 16;
    private static readonly IV_LENGTH = 12;
    private static readonly ITERATIONS = 100000;

    /**
     * Derive a cryptographic key from a password
     */
    async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        try {
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);

            // Import the password as a key
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            // Derive the encryption key
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: SecurityManager.ITERATIONS,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: SecurityManager.ALGORITHM,
                    length: SecurityManager.KEY_LENGTH
                },
                false,
                ['encrypt', 'decrypt']
            );

            return key;
        } catch (error) {
            throw new EncryptionError(`Failed to derive key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Encrypt a plaintext string
     */
    async encrypt(plaintext: string, password: string): Promise<string> {
        try {
            const encoder = new TextEncoder();
            const plaintextBuffer = encoder.encode(plaintext);

            // Generate random salt and IV
            const salt = crypto.getRandomValues(new Uint8Array(SecurityManager.SALT_LENGTH));
            const iv = crypto.getRandomValues(new Uint8Array(SecurityManager.IV_LENGTH));

            // Derive key from password
            const key = await this.deriveKey(password, salt);

            // Encrypt the data
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: SecurityManager.ALGORITHM,
                    iv: iv
                },
                key,
                plaintextBuffer
            );

            // Combine salt + IV + ciphertext
            const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

            // Convert to base64
            return this.arrayBufferToBase64(combined);
        } catch (error) {
            throw new EncryptionError(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Decrypt a ciphertext string
     */
    async decrypt(ciphertext: string, password: string): Promise<string> {
        try {
            // Convert from base64
            const combined = this.base64ToArrayBuffer(ciphertext);

            // Extract salt, IV, and encrypted data
            const salt = combined.slice(0, SecurityManager.SALT_LENGTH);
            const iv = combined.slice(SecurityManager.SALT_LENGTH, SecurityManager.SALT_LENGTH + SecurityManager.IV_LENGTH);
            const encrypted = combined.slice(SecurityManager.SALT_LENGTH + SecurityManager.IV_LENGTH);

            // Derive key from password
            const key = await this.deriveKey(password, salt);

            // Decrypt the data
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: SecurityManager.ALGORITHM,
                    iv: iv
                },
                key,
                encrypted
            );

            // Convert to string
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            throw new EncryptionError(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Hash a password for storage
     */
    async hashPassword(password: string): Promise<string> {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
        } catch (error) {
            throw new EncryptionError(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Verify a password against a hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        try {
            const computedHash = await this.hashPassword(password);
            return computedHash === hash;
        } catch {
            return false;
        }
    }

    /**
     * Convert ArrayBuffer to base64 string
     */
    private arrayBufferToBase64(buffer: Uint8Array): string {
        let binary = '';
        const len = buffer.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert base64 string to Uint8Array
     */
    private base64ToArrayBuffer(base64: string): Uint8Array {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Generate a secure random string
     */
    generateRandomString(length: number): string {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}