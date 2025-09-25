import React from 'react';
import { AgentMode, AgentModeConfig } from '../types/orchestrator.types';
import { Agent } from '../types/agent.types';
import './AgentModeSelector.css';

interface AgentModeSelectorProps {
  currentMode: AgentModeConfig;
  onModeChange: (config: AgentModeConfig) => void;
  agents: Agent[];
  disabled?: boolean;
}

const AgentModeSelector: React.FC<AgentModeSelectorProps> = ({
  currentMode,
  onModeChange,
  agents,
  disabled = false
}) => {
  const handleModeToggle = (mode: AgentMode) => {
    if (mode === 'orchestrator') {
      onModeChange({
        mode: 'orchestrator',
        showRoutingDetails: currentMode.showRoutingDetails ?? true
      });
    } else {
      onModeChange({
        mode: 'direct',
        selectedAgent: currentMode.selectedAgent,
        agentAliasId: currentMode.agentAliasId || 'TSTALIASID',
        showRoutingDetails: false
      });
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    onModeChange({
      ...currentMode,
      selectedAgent: agent,
      agentAliasId: currentMode.agentAliasId || 'TSTALIASID'
    });
  };

  const handleAliasChange = (aliasId: string) => {
    onModeChange({
      ...currentMode,
      agentAliasId: aliasId
    });
  };

  const toggleRoutingDetails = () => {
    onModeChange({
      ...currentMode,
      showRoutingDetails: !currentMode.showRoutingDetails
    });
  };

  return (
    <div className="agent-mode-selector">
      <div className="mode-header">
        <h3>🤖 Agent Configuration</h3>
        <div className="mode-toggle">
          <button
            className={`mode-button ${currentMode.mode === 'orchestrator' ? 'active' : ''}`}
            onClick={() => handleModeToggle('orchestrator')}
            disabled={disabled}
          >
            🎯 Smart Orchestrator
          </button>
          <button
            className={`mode-button ${currentMode.mode === 'direct' ? 'active' : ''}`}
            onClick={() => handleModeToggle('direct')}
            disabled={disabled}
          >
            🔗 Direct Agent
          </button>
        </div>
      </div>

      <div className="mode-content">
        {currentMode.mode === 'orchestrator' ? (
          <div className="orchestrator-config">
            <div className="config-description">
              <div className="feature-highlight">
                <span className="highlight-icon">✨</span>
                <div className="highlight-text">
                  <strong>Intelligent Agent Routing</strong>
                  <p>Your queries will be automatically routed to the most appropriate specialist:</p>
                </div>
              </div>
              
              <div className="specialists-grid">
                <div className="specialist-card">
                  <div className="specialist-header">
                    <span className="specialist-emoji">💻</span>
                    <span className="specialist-title">Technical Specialist</span>
                  </div>
                  <p>Programming, debugging, architecture, DevOps</p>
                </div>
                
                <div className="specialist-card">
                  <div className="specialist-header">
                    <span className="specialist-emoji">📊</span>
                    <span className="specialist-title">Business Analyst</span>
                  </div>
                  <p>Strategy, ROI analysis, project management</p>
                </div>
                
                <div className="specialist-card">
                  <div className="specialist-header">
                    <span className="specialist-emoji">🎨</span>
                    <span className="specialist-title">Creative Specialist</span>
                  </div>
                  <p>Content creation, design, marketing</p>
                </div>
                
                <div className="specialist-card">
                  <div className="specialist-header">
                    <span className="specialist-emoji">📈</span>
                    <span className="specialist-title">Data Scientist</span>
                  </div>
                  <p>Analytics, ML, statistical modeling</p>
                </div>
              </div>
            </div>

            <div className="orchestrator-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={currentMode.showRoutingDetails ?? true}
                  onChange={toggleRoutingDetails}
                  disabled={disabled}
                />
                <span className="checkmark">✓</span>
                Show routing decisions and confidence scores
              </label>
            </div>
          </div>
        ) : (
          <div className="direct-config">
            <div className="config-description">
              <div className="feature-highlight">
                <span className="highlight-icon">🔗</span>
                <div className="highlight-text">
                  <strong>Direct Agent Communication</strong>
                  <p>Communicate directly with a specific Bedrock agent</p>
                </div>
              </div>
            </div>

            <div className="agent-selection">
              <div className="form-group">
                <label htmlFor="agent-select">Select Agent:</label>
                <select
                  id="agent-select"
                  value={currentMode.selectedAgent?.agentId || ''}
                  onChange={(e) => {
                    const agent = agents.find(a => a.agentId === e.target.value);
                    if (agent) handleAgentSelect(agent);
                  }}
                  disabled={disabled}
                  className="agent-select"
                >
                  <option value="">Choose an agent...</option>
                  {agents.map((agent) => (
                    <option key={agent.agentId} value={agent.agentId}>
                      {agent.agentName} ({agent.agentId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="alias-input">Agent Alias ID:</label>
                <input
                  id="alias-input"
                  type="text"
                  value={currentMode.agentAliasId || ''}
                  onChange={(e) => handleAliasChange(e.target.value)}
                  placeholder="Enter alias ID (e.g., TSTALIASID)"
                  disabled={disabled}
                  className="alias-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentModeSelector;