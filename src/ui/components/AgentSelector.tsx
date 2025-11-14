/**
 * AgentSelector Component
 * Dropdown for selecting agents with "Auto (Orchestrator)" option
 * FR-015: Agent selection dropdown
 */

import { Agent } from '../../types/Agent';

interface AgentSelectorProps {
    agents: Agent[];
    selectedAgentId: string | null;
    onAgentSelect: (agentId: string | null) => void;
    showOrchestrator: boolean;
}

export function AgentSelector({
    agents,
    selectedAgentId,
    onAgentSelect,
    showOrchestrator
}: AgentSelectorProps) {
    const handleChange = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        const value = target.value;
        onAgentSelect(value === 'auto' ? null : value);
    };

    // Separate backend and custom agents
    const backendAgents = agents.filter(a => a.isBackend && a.enabled);
    const customAgents = agents.filter(a => !a.isBackend && a.enabled);

    return (
        <div className="mnemosyne-agent-selector">
            <select
                className="mnemosyne-agent-dropdown"
                value={selectedAgentId || 'auto'}
                onChange={handleChange}
            >
                {showOrchestrator && (
                    <option value="auto">Auto (Orchestrator)</option>
                )}

                {backendAgents.length > 0 && (
                    <optgroup label="Backend agents">
                        {backendAgents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name}
                            </option>
                        ))}
                    </optgroup>
                )}

                {customAgents.length > 0 && (
                    <optgroup label="Custom agents">
                        {customAgents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name}
                            </option>
                        ))}
                    </optgroup>
                )}
            </select>

            {selectedAgentId && (
                <div className="mnemosyne-agent-description">
                    {agents.find(a => a.id === selectedAgentId)?.description}
                </div>
            )}
        </div>
    );
}
