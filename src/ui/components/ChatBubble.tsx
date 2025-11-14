/**
 * ChatBubble Component
 * Displays individual messages with user/agent distinction
 * FR-071: Message display with markdown rendering
 */

import { ConversationMessage } from '../../types/Conversation';
import { formatTimestamp } from '../../utils/MarkdownUtils';

interface ChatBubbleProps {
    message: ConversationMessage;
    showTimestamp: boolean;
    showSourceCitations: boolean;
}

export function ChatBubble({ message, showTimestamp, showSourceCitations }: ChatBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`mnemosyne-message ${isUser ? 'user' : 'assistant'}`}>
            <div className="mnemosyne-message-content">
                {message.content}
            </div>

            {message.agentName && !isUser && (
                <div className="mnemosyne-message-meta">
                    Agent: {message.agentName}
                </div>
            )}

            {showTimestamp && (
                <div className="mnemosyne-message-meta">
                    {formatTimestamp(message.timestamp, 'relative')}
                </div>
            )}

            {showSourceCitations && message.sources && message.sources.length > 0 && (
                <div className="mnemosyne-sources">
                    <div className="mnemosyne-sources-heading">Sources:</div>
                    {message.sources.map((source, idx) => (
                        <div key={idx} className="mnemosyne-source-item">
                            <a
                                href={source.filePath}
                                className="mnemosyne-source-link"
                            >
                                {source.title}
                            </a>
                            {source.excerpt && (
                                <div className="mnemosyne-source-excerpt">
                                    {source.excerpt}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {message.usage && (
                <div className="mnemosyne-message-meta mnemosyne-message-tokens">
                    Tokens: {message.usage.totalTokens}
                </div>
            )}
        </div>
    );
}
