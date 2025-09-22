import React, { useState, useCallback, useEffect } from 'react';
import { 
  OrchestratorConversationMessage, 
  OrchestratorSession,
  OrchestratorResponse
} from '../types/orchestrator.types';
import { OrchestratorAPI } from '../services/orchestrator.service';
import OrchestratorChatInterface from './OrchestratorChatInterface';
import './OrchestratorSearch.css';

const OrchestratorSearch: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<OrchestratorSession | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showRoutingDetails, setShowRoutingDetails] = useState(true);

  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check orchestrator status
        await OrchestratorAPI.getOrchestratorStatus();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize orchestrator');
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, []);

  const createOrchestratorSession = (sessionId: string): OrchestratorSession => {
    return {
      sessionId,
      agentId: 'orchestrator',
      agentAliasId: 'orchestrator',
      agentName: 'AI Orchestrator',
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

  const clearSession = () => {
    setCurrentSession(undefined);
    setError(null);
  };

  if (!isInitialized) {
    return (
      <div className="orchestrator-search loading">
        <div className="loading-content">
          <div className="loading-spinner">🤖</div>
          <p>Initializing AI Orchestrator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orchestrator-search">
      <div className="search-header">
        <h1>🎯 AI Orchestrator</h1>
        <p>Intelligent routing to specialized AI agents for optimal responses</p>
      </div>

      <div className="orchestrator-controls">
        <label className="routing-toggle">
          <input
            type="checkbox"
            checked={showRoutingDetails}
            onChange={(e) => setShowRoutingDetails(e.target.checked)}
          />
          <span className="toggle-slider"></span>
          Show routing details
        </label>
      </div>

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
              <span className="session-icon">🤖</span>
              <div className="session-text">
                <strong>{currentSession.agentName}</strong>
                <span className="session-meta">
                  {currentSession.messages.length / 2} exchanges
                  {currentSession.specialist_switches > 0 && (
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

        <OrchestratorChatInterface
          messages={currentSession?.messages || []}
          onSendMessage={handleOrchestratorMessage}
          isLoading={isLoading}
          disabled={false}
          showRoutingDetails={showRoutingDetails}
        />
      </div>
    </div>
  );
};

export default OrchestratorSearch;