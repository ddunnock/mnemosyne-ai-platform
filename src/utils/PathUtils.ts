/**
 * Path Utilities
 * Wrappers for Obsidian's normalizePath per constitution requirement
 */

import { normalizePath as obsidianNormalizePath, TFile, Vault } from 'obsidian';

/**
 * Normalize a file path using Obsidian's normalizePath
 * Constitution Requirement I: All file paths must use normalizePath()
 */
export function normalizePath(path: string): string {
    return obsidianNormalizePath(path);
}

/**
 * Join path segments and normalize the result
 */
export function joinPath(...segments: string[]): string {
    const joined = segments.join('/');
    return normalizePath(joined);
}

/**
 * Get the parent directory of a path
 */
export function getParentPath(path: string): string {
    const normalized = normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === -1) {
        return '';
    }
    return normalized.substring(0, lastSlash);
}

/**
 * Get the file name from a path (without extension)
 */
export function getFileName(path: string): string {
    const normalized = normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    const fileName = lastSlash === -1 ? normalized : normalized.substring(lastSlash + 1);
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? fileName : fileName.substring(0, lastDot);
}

/**
 * Get the full file name with extension from a path
 */
export function getFileNameWithExtension(path: string): string {
    const normalized = normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash === -1 ? normalized : normalized.substring(lastSlash + 1);
}

/**
 * Get the file extension from a path
 */
export function getFileExtension(path: string): string {
    const normalized = normalizePath(path);
    const lastDot = normalized.lastIndexOf('.');
    return lastDot === -1 ? '' : normalized.substring(lastDot + 1);
}

/**
 * Check if a path is within a specific folder
 */
export function isPathInFolder(path: string, folder: string): boolean {
    const normalizedPath = normalizePath(path);
    const normalizedFolder = normalizePath(folder);

    if (normalizedFolder === '') {
        return true;  // Root folder contains everything
    }

    return normalizedPath.startsWith(normalizedFolder + '/') || normalizedPath === normalizedFolder;
}

/**
 * Check if a path matches any of the given folder restrictions
 */
export function isPathAllowed(path: string, allowedFolders?: string[]): boolean {
    if (!allowedFolders || allowedFolders.length === 0) {
        return true;  // No restrictions
    }

    const normalizedPath = normalizePath(path);
    return allowedFolders.some(folder => isPathInFolder(normalizedPath, folder));
}

/**
 * Get relative path from one file to another
 */
export function getRelativePath(from: string, to: string): string {
    const fromParts = normalizePath(from).split('/');
    const toParts = normalizePath(to).split('/');

    // Remove file name from 'from' path
    fromParts.pop();

    // Find common ancestor
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);
    for (let i = 0; i < minLength; i++) {
        if (fromParts[i] === toParts[i]) {
            commonLength++;
        } else {
            break;
        }
    }

    // Build relative path
    const upLevels = fromParts.length - commonLength;
    const relativeParts: string[] = [];

    for (let i = 0; i < upLevels; i++) {
        relativeParts.push('..');
    }

    for (let i = commonLength; i < toParts.length; i++) {
        relativeParts.push(toParts[i]);
    }

    return relativeParts.join('/') || '.';
}

/**
 * Ensure a path has a specific extension
 */
export function ensureExtension(path: string, extension: string): string {
    const normalized = normalizePath(path);
    const currentExt = getFileExtension(normalized);
    const targetExt = extension.startsWith('.') ? extension.substring(1) : extension;

    if (currentExt === targetExt) {
        return normalized;
    }

    if (currentExt) {
        // Replace existing extension
        return normalized.substring(0, normalized.lastIndexOf('.')) + '.' + targetExt;
    }

    // Add extension
    return normalized + '.' + targetExt;
}

/**
 * Check if a file exists in the vault
 */
export async function fileExists(vault: Vault, path: string): Promise<boolean> {
    const normalized = normalizePath(path);
    const file = vault.getAbstractFileByPath(normalized);
    return file instanceof TFile;
}

/**
 * Get a unique file path by appending a number if the file already exists
 */
export async function getUniqueFilePath(vault: Vault, path: string): Promise<string> {
    let normalized = normalizePath(path);

    if (!await fileExists(vault, normalized)) {
        return normalized;
    }

    const dir = getParentPath(normalized);
    const name = getFileName(normalized);
    const ext = getFileExtension(normalized);

    let counter = 1;
    while (true) {
        const newPath = joinPath(dir, `${name} ${counter}.${ext}`);
        if (!await fileExists(vault, newPath)) {
            return newPath;
        }
        counter++;
    }
}

/**
 * Sanitize a file name by removing invalid characters
 */
export function sanitizeFileName(name: string): string {
    // Remove or replace characters that are invalid in file names
    return name
        .replace(/[\\/:*?"<>|]/g, '-')  // Replace invalid chars with dash
        .replace(/\s+/g, ' ')            // Normalize whitespace
        .trim();
}

/**
 * Create a valid file path from a title
 */
export function createFilePathFromTitle(title: string, folder: string = '', extension: string = 'md'): string {
    const sanitizedTitle = sanitizeFileName(title);
    const fileName = ensureExtension(sanitizedTitle, extension);

    if (folder) {
        return joinPath(folder, fileName);
    }

    return normalizePath(fileName);
}
