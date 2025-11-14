/**
 * Chat View
 * Main chat interface in right sidebar with Preact rendering
 * FR-012, FR-071, FR-072: Chat interface with Preact components
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { render } from 'preact';
import { ChatBubble } from './components/ChatBubble';
import { AgentSelector } from './components/AgentSelector';
import { ConversationList } from './components/ConversationList';
import { CompressionIndicator } from './components/CompressionIndicator';
import { AgentManager } from '../agents/AgentManager';
import { Conversation, ConversationListItem } from '../types/Conversation';
import { Agent } from '../types/Agent';

export const CHAT_VIEW_TYPE = 'mnemosyne-chat-view';

export class ChatView extends ItemView {
    private agentManager: AgentManager;
    private currentConversation: Conversation | null = null;
    private selectedAgentId: string | null = null;
    private showOrchestrator = false;

    constructor(leaf: WorkspaceLeaf, agentManager: AgentManager) {
        super(leaf);
        this.agentManager = agentManager;
    }

    getViewType(): string {
        return CHAT_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'AI Chat';
    }

    getIcon(): string {
        return 'message-square';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('mnemosyne-chat-view');

        // Create new conversation
        this.startNewConversation();

        // Render the UI
        this.renderUI();
    }

    async onClose(): Promise<void> {
        // Clean up Preact rendering
        const container = this.containerEl.children[1];
        render(null, container);
    }

    private startNewConversation(): void {
        this.currentConversation = this.agentManager.createConversation(this.selectedAgentId || undefined);
    }

    private renderUI(): void {
        const container = this.containerEl.children[1];
        container.empty();

        // Create main layout
        const chatContainer = container.createDiv({ cls: 'mnemosyne-chat-container' });

        // Header with agent selector
        const header = chatContainer.createDiv({ cls: 'mnemosyne-chat-header' });
        this.renderAgentSelector(header);

        // Messages area
        const messagesArea = chatContainer.createDiv({ cls: 'mnemosyne-chat-messages' });
        this.renderMessages(messagesArea);

        // Compression indicator
        if (this.currentConversation) {
            const indicatorContainer = chatContainer.createDiv({ cls: 'mnemosyne-compression-container' });
            this.renderCompressionIndicator(indicatorContainer);
        }

        // Input area
        const inputArea = chatContainer.createDiv({ cls: 'mnemosyne-chat-input-container' });
        this.renderInput(inputArea);

        // Sidebar with conversation list
        const sidebar = container.createDiv({ cls: 'mnemosyne-chat-sidebar' });
        this.renderConversationList(sidebar);
    }

    private renderAgentSelector(container: HTMLElement): void {
        const agents = this.agentManager.getAllAgents();

        render(
            <AgentSelector
                agents={agents}
                selectedAgentId={this.selectedAgentId}
                onAgentSelect={(agentId) => {
                    this.selectedAgentId = agentId;
                    if (this.currentConversation && !this.currentConversation.agentId) {
                        this.currentConversation.agentId = agentId || undefined;
                    }
                    this.renderUI();
                }}
                showOrchestrator={this.showOrchestrator}
            />,
            container
        );
    }

    private renderMessages(container: HTMLElement): void {
        if (!this.currentConversation) {
            container.createEl('p', {
                text: 'No conversation selected. Start a new one!',
                cls: 'mnemosyne-no-conversation'
            });
            return;
        }

        const messages = this.currentConversation.messages;

        if (messages.length === 0) {
            container.createEl('p', {
                text: 'Start the conversation by typing a message below.',
                cls: 'mnemosyne-empty-conversation'
            });
            return;
        }

        // Render each message
        messages.forEach(message => {
            const messageContainer = container.createDiv();
            render(
                <ChatBubble
                    message={message}
                    showTimestamp={true}
                    showSourceCitations={true}
                />,
                messageContainer
            );
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    private renderCompressionIndicator(container: HTMLElement): void {
        if (!this.currentConversation) return;

        render(
            <CompressionIndicator
                contextState={this.currentConversation.contextState}
            />,
            container
        );
    }

    private renderInput(container: HTMLElement): void {
        const inputContainer = container.createDiv({ cls: 'mnemosyne-input-wrapper' });

        const textarea = inputContainer.createEl('textarea', {
            cls: 'mnemosyne-chat-input',
            attr: {
                placeholder: 'Type your message...',
                rows: '3'
            }
        });

        const sendButton = inputContainer.createEl('button', {
            text: 'Send',
            cls: 'mnemosyne-button mnemosyne-send-button'
        });

        const sendMessage = async () => {
            const message = textarea.value.trim();
            if (!message || !this.currentConversation) return;

            // Clear input
            textarea.value = '';

            // Disable input while processing
            textarea.disabled = true;
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';

            try {
                // Send message through agent manager
                await this.agentManager.sendMessage(
                    this.currentConversation.id,
                    message,
                    this.selectedAgentId || undefined
                );

                // Re-render to show new messages
                this.renderUI();
            } catch (error) {
                console.error('Failed to send message:', error);
                // Show error to user
                const errorDiv = container.createDiv({ cls: 'mnemosyne-error' });
                errorDiv.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                setTimeout(() => errorDiv.remove(), 5000);
            } finally {
                // Re-enable input
                textarea.disabled = false;
                sendButton.disabled = false;
                sendButton.textContent = 'Send';
                textarea.focus();
            }
        };

        sendButton.onclick = sendMessage;

        // Send on Ctrl+Enter or Cmd+Enter
        textarea.onkeydown = (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
            }
        };
    }

    private renderConversationList(container: HTMLElement): void {
        const conversations = this.agentManager.getActiveConversations();
        const agents = this.agentManager.getAllAgents();

        // Convert to ConversationListItems
        const conversationItems: ConversationListItem[] = conversations.map(conv => {
            const agent = conv.agentId ? agents.find(a => a.id === conv.agentId) : undefined;
            const preview = conv.messages.length > 0
                ? conv.messages[0].content.substring(0, 100)
                : 'No messages yet';

            return {
                id: conv.id,
                title: conv.title || 'New conversation',
                preview,
                agentName: agent?.name,
                lastActiveAt: conv.lastActiveAt,
                messageCount: conv.messages.length,
                archived: conv.archived
            };
        });

        render(
            <ConversationList
                conversations={conversationItems}
                activeConversationId={this.currentConversation?.id || null}
                onConversationSelect={(conversationId) => {
                    this.currentConversation = this.agentManager.getConversation(conversationId) || null;
                    if (this.currentConversation) {
                        this.selectedAgentId = this.currentConversation.agentId || null;
                    }
                    this.renderUI();
                }}
                onNewConversation={() => {
                    this.startNewConversation();
                    this.renderUI();
                }}
                onArchiveConversation={(conversationId) => {
                    this.agentManager.archiveConversation(conversationId);
                    this.renderUI();
                }}
                onDeleteConversation={(conversationId) => {
                    this.agentManager.deleteConversation(conversationId);
                    if (this.currentConversation?.id === conversationId) {
                        this.startNewConversation();
                    }
                    this.renderUI();
                }}
            />,
            container
        );
    }
}
