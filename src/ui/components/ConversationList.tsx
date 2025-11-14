/**
 * ConversationList Component
 * Shows recent conversations with timestamps
 * FR-017: Recent conversations display
 */

import { ConversationListItem } from '../../types/Conversation';
import { formatTimestamp } from '../../utils/MarkdownUtils';

interface ConversationListProps {
    conversations: ConversationListItem[];
    activeConversationId: string | null;
    onConversationSelect: (conversationId: string) => void;
    onNewConversation: () => void;
    onArchiveConversation: (conversationId: string) => void;
    onDeleteConversation: (conversationId: string) => void;
}

export function ConversationList({
    conversations,
    activeConversationId,
    onConversationSelect,
    onNewConversation,
    onArchiveConversation,
    onDeleteConversation
}: ConversationListProps) {
    return (
        <div className="mnemosyne-conversation-list">
            <div className="mnemosyne-conversation-list-header">
                <h3>Conversations</h3>
                <button
                    className="mnemosyne-button"
                    onClick={onNewConversation}
                >
                    New conversation
                </button>
            </div>

            {conversations.length === 0 && (
                <div className="mnemosyne-conversation-empty">
                    No conversations yet. Start a new one!
                </div>
            )}

            {conversations.map(conversation => (
                <div
                    key={conversation.id}
                    className={`mnemosyne-conversation-item ${
                        conversation.id === activeConversationId ? 'active' : ''
                    }`}
                    onClick={() => onConversationSelect(conversation.id)}
                >
                    <div className="mnemosyne-conversation-title">
                        {conversation.title || 'New conversation'}
                    </div>

                    <div className="mnemosyne-conversation-preview">
                        {conversation.preview}
                    </div>

                    <div className="mnemosyne-conversation-meta">
                        {conversation.agentName && (
                            <span className="mnemosyne-conversation-agent">
                                {conversation.agentName}
                            </span>
                        )}
                        <span className="mnemosyne-conversation-time">
                            {formatTimestamp(conversation.lastActiveAt, 'relative')}
                        </span>
                        <span className="mnemosyne-conversation-count">
                            {conversation.messageCount} messages
                        </span>
                    </div>

                    <div className="mnemosyne-conversation-actions">
                        <button
                            className="mnemosyne-button-secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                onArchiveConversation(conversation.id);
                            }}
                        >
                            Archive
                        </button>
                        <button
                            className="mnemosyne-button-secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this conversation?')) {
                                    onDeleteConversation(conversation.id);
                                }
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
