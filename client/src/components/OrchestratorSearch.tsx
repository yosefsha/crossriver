import React, { useState, useCallback, useEffect } from 'react';
import { Agent } from '../types/agent.types';
import { 
  AgentModeConfig, 
  OrchestratorConversationMessage, 
  OrchestratorSession,
  OrchestratorResponse
} from '../types/orchestrator.types';
import { AgentRouterAPI } from '../services/agentRouter.service';
import { OrchestratorAPI } from '../services/orchestrator.service';
import AgentModeSelector from './AgentModeSelector';
import OrchestratorChatInterface from './OrchestratorChatInterface';
import ChatInterface from './ChatInterface';
import './OrchestratorSearch.css';

const OrchestratorSearch: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentModeConfig, setAgentModeConfig] = useState<AgentModeConfig>({
    mode: 'orchestrator',
    showRoutingDetails: true
  });
  const [currentSession, setCurrentSession] = useState<OrchestratorSession | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load available agents for direct mode
        const availableAgents = await AgentRouterAPI.getAgents();
        setAgents(availableAgents);

        // Check orchestrator status
        try {
          await OrchestratorAPI.getOrchestratorStatus();
          // Orchestrator is available, default to orchestrator mode
          setAgentModeConfig(prev => ({ ...prev, mode: 'orchestrator' }));
        } catch (orchError) {
          // Orchestrator not available, default to direct mode
          console.warn('Orchestrator not available, falling back to direct mode:', orchError);
          setAgentModeConfig(prev => ({ 
            ...prev, 
            mode: 'direct',
            selectedAgent: availableAgents[0],
            agentAliasId: 'TSTALIASID'
          }));
        }

        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, []);

  const handleModeChange = useCallback((config: AgentModeConfig) => {
    setAgentModeConfig(config);
    setCurrentSession(undefined); // Reset session when mode changes
    setError(null);
  }, []);

  const createOrchestratorSession = (sessionId: string): OrchestratorSession => {
    return {
      sessionId,
      agentId: 'orchestrator',
      agentAliasId: 'orchestrator',
      agentName: 'Smart Orchestrator',
      messages: [],
      isActive: true,
      createdAt: new Date(),
      orchestrator_enabled: true,
      routing_history: [],
      specialist_switches: 0
    };
  };

  const handleOrchestratorMessage = async (message: string) => {
    try {
      setIsLoading(true);
      setError(null);

      let response: OrchestratorResponse;
      let session = currentSession;

      // Start new session or continue existing one
      if (!session) {
        response = await OrchestratorAPI.startOrchestratedSession(message);
        session = createOrchestratorSession(response.session_id);
      } else {
        response = await OrchestratorAPI.orchestrateQuery(message, session.sessionId);
      }

      // Add user message
      const userMessage: OrchestratorConversationMessage = {
        id: generateMessageId(),
        content: message,
        isUser: true,
        timestamp: new Date(),
      };

      // Add agent response with routing info
      const agentMessage: OrchestratorConversationMessage = {
        id: generateMessageId(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
        routing_info: {
          handling_agent: response.handling_agent,
          agent_name: response.agent_name,
          confidence_score: response.routing_analysis.confidence_scores[response.handling_agent] || 0,
          reasoning: response.routing_analysis.reasoning,
          keywords_matched: response.routing_analysis.keywords_matched,
          intent: response.routing_analysis.analyzed_intent
        }
      };

      // Update session
      session.messages.push(userMessage, agentMessage);
      session.routing_history.push(response.routing_analysis);
      
      // Count specialist switches
      if (session.routing_history.length > 1) {
        const prevAgent = session.routing_history[session.routing_history.length - 2].selected_agent;
        const currentAgent = response.routing_analysis.selected_agent;
        if (prevAgent !== currentAgent) {
          session.specialist_switches++;
        }
      }

      setCurrentSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectMessage = async (message: string) => {
    if (!agentModeConfig.selectedAgent || !agentModeConfig.agentAliasId) {
      setError('Please select an agent first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let response;
      let session = currentSession;

      // Start new session or continue existing one
      if (!session) {
        response = await AgentRouterAPI.startSession(
          agentModeConfig.selectedAgent.agentId,
          agentModeConfig.agentAliasId,
          { initialMessage: message }
        );
        
        session = {
          sessionId: response.sessionId,
          agentId: agentModeConfig.selectedAgent.agentId,
          agentAliasId: agentModeConfig.agentAliasId,
          agentName: agentModeConfig.selectedAgent.agentName,
          messages: [],
          isActive: true,
          createdAt: new Date(),
          orchestrator_enabled: false,
          routing_history: [],
          specialist_switches: 0
        };
      } else {
        response = await AgentRouterAPI.sendMessage(
          agentModeConfig.selectedAgent.agentId,
          agentModeConfig.agentAliasId,
          { message, sessionId: session.sessionId }
        );
      }

      // Add user message
      const userMessage: OrchestratorConversationMessage = {
        id: generateMessageId(),
        content: message,
        isUser: true,
        timestamp: new Date(),
      };

      // Add agent response
      const agentMessage: OrchestratorConversationMessage = {
        id: generateMessageId(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
      };

      session.messages.push(userMessage, agentMessage);
      setCurrentSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (agentModeConfig.mode === 'orchestrator') {
      await handleOrchestratorMessage(message);
    } else {
      await handleDirectMessage(message);
    }
  };

  const clearSession = () => {
    setCurrentSession(undefined);
    setError(null);
  };

  if (!isInitialized) {
    return (
      <div className="orchestrator-search loading">
        <div className="loading-content">
          <div className="loading-spinner">⏳</div>
          <p>Initializing agent orchestrator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orchestrator-search">
      <div className="search-header">
        <h1>🤖 AI Agent Assistant</h1>
        <p>Choose between smart orchestration or direct agent communication</p>
      </div>

      <AgentModeSelector
        currentMode={agentModeConfig}
        onModeChange={handleModeChange}
        agents={agents}
        disabled={isLoading}
      />

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="chat-section">
        {currentSession && (
          <div className="session-info">
            <div className="session-details">
              <span className="session-icon">
                {agentModeConfig.mode === 'orchestrator' ? '🎯' : '🔗'}
              </span>
              <div className="session-text">
                <strong>{currentSession.agentName}</strong>
                <span className="session-meta">
                  {currentSession.messages.length / 2} exchanges
                  {currentSession.orchestrator_enabled && currentSession.specialist_switches > 0 && (
                    <span className="specialist-switches">
                      • {currentSession.specialist_switches} specialist switches
                    </span>
                  )}
                </span>
              </div>
            </div>
            <button className="clear-session" onClick={clearSession} disabled={isLoading}>
              🗑️ Clear
            </button>
          </div>
        )}

        {agentModeConfig.mode === 'orchestrator' ? (
          <OrchestratorChatInterface
            messages={currentSession?.messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={false}
            showRoutingDetails={agentModeConfig.showRoutingDetails}
          />
        ) : (
          <ChatInterface
            messages={currentSession?.messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!agentModeConfig.selectedAgent || !agentModeConfig.agentAliasId}
            placeholder={
              agentModeConfig.selectedAgent 
                ? `Message ${agentModeConfig.selectedAgent.agentName}...`
                : "Please select an agent first..."
            }
          />
        )}
      </div>
    </div>
  );
};

export default OrchestratorSearch;