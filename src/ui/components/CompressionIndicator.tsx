/**
 * CompressionIndicator Component
 * Shows messages remaining before context compression
 * FR-083: Compression indicator display
 */

import { ContextState } from '../../types/Conversation';

interface CompressionIndicatorProps {
    contextState: ContextState;
}

export function CompressionIndicator({ contextState }: CompressionIndicatorProps) {
    const percentage = Math.min(100, contextState.tokenPercentageUsed);
    const messagesRemaining = contextState.messagesUntilCompression;

    // Determine color based on usage
    let statusClass = 'ok';
    if (percentage >= 80) {
        statusClass = 'critical';
    } else if (percentage >= 60) {
        statusClass = 'warning';
    }

    return (
        <div className={`mnemosyne-compression-indicator status-${statusClass}`}>
            <div className="mnemosyne-compression-info">
                <span className="mnemosyne-compression-messages">
                    {messagesRemaining} messages until compression
                </span>
                <span className="mnemosyne-compression-percentage">
                    {percentage.toFixed(1)}% context used
                </span>
            </div>

            <div className="mnemosyne-compression-bar">
                <div
                    className="mnemosyne-compression-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {contextState.compressionTriggered && (
                <div className="mnemosyne-compression-warning">
                    Context compression will occur on next message
                </div>
            )}

            {contextState.lastCompressionAt && (
                <div className="mnemosyne-compression-meta">
                    Last compressed: {new Date(contextState.lastCompressionAt).toLocaleString()}
                </div>
            )}
        </div>
    );
}
