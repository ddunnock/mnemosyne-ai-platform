/**
 * Markdown Utilities
 * Helpers for markdown rendering using Obsidian's MarkdownRenderer API
 * Constitution Requirement II: Use Obsidian's MarkdownRenderer, not innerHTML
 */

import { App, Component, MarkdownRenderer } from 'obsidian';
import { normalizePath } from './PathUtils';

/**
 * Render markdown content to an HTML element using Obsidian's MarkdownRenderer
 * Constitution compliant: Uses MarkdownRenderer API instead of innerHTML
 */
export async function renderMarkdown(
    app: App,
    markdown: string,
    containerEl: HTMLElement,
    sourcePath: string = '',
    component: Component
): Promise<void> {
    // Clear existing content
    containerEl.empty();

    // Use Obsidian's MarkdownRenderer for safe rendering
    await MarkdownRenderer.render(
        app,
        markdown,
        containerEl,
        normalizePath(sourcePath),
        component
    );
}

/**
 * Render inline markdown (no block elements)
 */
export async function renderInlineMarkdown(
    app: App,
    markdown: string,
    containerEl: HTMLElement,
    sourcePath: string = '',
    component: Component
): Promise<void> {
    // Clear existing content
    containerEl.empty();

    // Render as inline
    await MarkdownRenderer.renderMarkdown(
        markdown,
        containerEl,
        sourcePath,
        component
    );

    // Remove block-level wrappers for inline display
    const paragraphs = containerEl.querySelectorAll('p');
    paragraphs.forEach(p => {
        if (p.parentElement === containerEl) {
            while (p.firstChild) {
                containerEl.insertBefore(p.firstChild, p);
            }
            p.remove();
        }
    });
}

/**
 * Strip markdown formatting to get plain text
 */
export function stripMarkdown(markdown: string): string {
    return markdown
        // Remove headers
        .replace(/#{1,6}\s+/g, '')
        // Remove bold/italic
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Remove links but keep text
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Remove images
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
        // Remove inline code
        .replace(/`([^`]+)`/g, '$1')
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove blockquotes
        .replace(/^\s*>\s+/gm, '')
        // Remove lists
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        // Remove horizontal rules
        .replace(/^\s*[-*_]{3,}\s*$/gm, '')
        // Normalize whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Extract first N words from markdown content
 */
export function extractExcerpt(markdown: string, wordCount: number = 50): string {
    const plainText = stripMarkdown(markdown);
    const words = plainText.split(/\s+/);

    if (words.length <= wordCount) {
        return plainText;
    }

    return words.slice(0, wordCount).join(' ') + '...';
}

/**
 * Create a markdown link to a file
 */
export function createWikiLink(path: string, displayText?: string): string {
    const normalizedPath = normalizePath(path);
    const text = displayText || normalizedPath;
    return `[[${normalizedPath}|${text}]]`;
}

/**
 * Create a markdown external link
 */
export function createExternalLink(url: string, text: string): string {
    return `[${text}](${url})`;
}

/**
 * Create a callout block
 */
export function createCallout(type: string, title: string, content: string): string {
    return `> [!${type}] ${title}\n> ${content.split('\n').join('\n> ')}`;
}

/**
 * Create a code block
 */
export function createCodeBlock(code: string, language: string = ''): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
}

/**
 * Create a table from data
 */
export function createTable(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');

    return `${headerRow}\n${separatorRow}\n${dataRows}`;
}

/**
 * Escape markdown special characters
 */
export function escapeMarkdown(text: string): string {
    return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

/**
 * Format a citation/source reference
 */
export function formatSourceCitation(
    fileName: string,
    path: string,
    excerpt?: string,
    lineNumbers?: [number, number]
): string {
    let citation = `📝 ${createWikiLink(path, fileName)}`;

    if (lineNumbers) {
        citation += ` (lines ${lineNumbers[0]}-${lineNumbers[1]})`;
    }

    if (excerpt) {
        citation += `\n> ${excerpt}`;
    }

    return citation;
}

/**
 * Format multiple source citations
 */
export function formatSourceCitations(
    sources: Array<{
        fileName: string;
        path: string;
        excerpt?: string;
        lineNumbers?: [number, number];
    }>
): string {
    if (sources.length === 0) {
        return '';
    }

    const citations = sources.map(source =>
        formatSourceCitation(source.fileName, source.path, source.excerpt, source.lineNumbers)
    );

    return `\n\n---\n**Sources:**\n\n${citations.join('\n\n')}`;
}

/**
 * Create a heading
 */
export function createHeading(text: string, level: number = 2): string {
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    return `${hashes} ${text}`;
}

/**
 * Create a bullet list
 */
export function createBulletList(items: string[]): string {
    return items.map(item => `- ${item}`).join('\n');
}

/**
 * Create a numbered list
 */
export function createNumberedList(items: string[]): string {
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

/**
 * Create a task list
 */
export function createTaskList(tasks: Array<{ text: string; completed: boolean }>): string {
    return tasks.map(task => `- [${task.completed ? 'x' : ' '}] ${task.text}`).join('\n');
}

/**
 * Format a timestamp for markdown
 */
export function formatTimestamp(timestamp: number, format: 'date' | 'datetime' | 'relative' = 'datetime'): string {
    const date = new Date(timestamp);

    if (format === 'date') {
        return date.toLocaleDateString();
    }

    if (format === 'datetime') {
        return date.toLocaleString();
    }

    // Relative format
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return 'just now';
    }
    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    if (days < 7) {
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }

    return date.toLocaleDateString();
}

/**
 * Create a frontmatter block
 */
export function createFrontmatter(data: Record<string, any>): string {
    const yaml = Object.entries(data)
        .map(([key, value]) => {
            if (Array.isArray(value)) {
                return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
            }
            return `${key}: ${value}`;
        })
        .join('\n');

    return `---\n${yaml}\n---`;
}

/**
 * Truncate text to a maximum length, preserving words
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
    if (text.length <= maxLength) {
        return text;
    }

    const truncated = text.substring(0, maxLength - ellipsis.length);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + ellipsis;
    }

    return truncated + ellipsis;
}
