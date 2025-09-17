import React, { useState, useEffect } from 'react';
import { Agent } from '../types/agent.types';
import { AgentRouterAPI } from '../services/agentRouter.service';
import './AgentSelector.css';

interface AgentSelectorProps {
  onAgentSelect: (agent: Agent, agentAliasId: string) => void;
  selectedAgent?: Agent;
  disabled?: boolean;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ 
  onAgentSelect, 
  selectedAgent, 
  disabled = false 
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentAliasId, setAgentAliasId] = useState('TSTALIASID'); // Default alias ID

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await AgentRouterAPI.getAgents();
      setAgents(fetchedAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const agentId = event.target.value;
    if (agentId) {
      const agent = agents.find(a => a.agentId === agentId);
      if (agent) {
        onAgentSelect(agent, agentAliasId);
      }
    }
  };

  const handleAliasChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAliasId = event.target.value;
    setAgentAliasId(newAliasId);
    if (selectedAgent && newAliasId) {
      onAgentSelect(selectedAgent, newAliasId);
    }
  };

  if (loading) {
    return (
      <div className="agent-selector">
        <div className="loading">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-selector">
        <div className="error">
          Error: {error}
          <button onClick={loadAgents} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-selector">
      <div className="selector-group">
        <label htmlFor="agent-select">Select Agent:</label>
        <select
          id="agent-select"
          value={selectedAgent?.agentId || ''}
          onChange={handleAgentChange}
          disabled={disabled}
          className="agent-dropdown"
        >
          <option value="">Choose an agent...</option>
          {agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentName || agent.agentId} ({agent.agentStatus})
            </option>
          ))}
        </select>
      </div>

      <div className="selector-group">
        <label htmlFor="alias-input">Agent Alias ID:</label>
        <input
          id="alias-input"
          type="text"
          value={agentAliasId}
          onChange={handleAliasChange}
          disabled={disabled}
          placeholder="Enter agent alias ID"
          className="alias-input"
        />
      </div>

      {selectedAgent && (
        <div className="selected-agent-info">
          <h4>Selected Agent:</h4>
          <p><strong>Name:</strong> {selectedAgent.agentName || 'N/A'}</p>
          <p><strong>ID:</strong> {selectedAgent.agentId}</p>
          <p><strong>Status:</strong> {selectedAgent.agentStatus}</p>
          {selectedAgent.description && (
            <p><strong>Description:</strong> {selectedAgent.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentSelector;