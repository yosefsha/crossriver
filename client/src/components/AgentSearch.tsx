import React, { useState, useCallback } from 'react';
import { Agent, ChatSession, ConversationMessage } from '../types/agent.types';
import { AgentRouterAPI } from '../services/agentRouter.service';
import AgentSelector from './AgentSelector';
import ChatInterface from './ChatInterface';
import './AgentSearch.css';

const AgentSearch: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>();
  const [agentAliasId, setAgentAliasId] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<ChatSession | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleAgentSelect = useCallback((agent: Agent, aliasId: string) => {
    setSelectedAgent(agent);
    setAgentAliasId(aliasId);
    setCurrentSession(undefined); // Reset session when agent changes
    setError(null);
  }, []);

  const startNewSession = async (initialMessage?: string) => {
    if (!selectedAgent || !agentAliasId) {
      setError('Please select an agent first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await AgentRouterAPI.startSession(
        selectedAgent.agentId,
        agentAliasId,
        { initialMessage }
      );

      const newSession: ChatSession = {
        sessionId: response.sessionId,
        agentId: selectedAgent.agentId,
        agentAliasId: agentAliasId,
        agentName: selectedAgent.agentName,
        messages: [],
        isActive: true,
        createdAt: new Date(),
      };

      // Add initial message if provided
      if (initialMessage) {
        newSession.messages.push({
          id: generateMessageId(),
          content: initialMessage,
          isUser: true,
          timestamp: new Date(),
        });
      }

      // Add agent response
      if (response.response) {
        newSession.messages.push({
          id: generateMessageId(),
          content: response.response,
          isUser: false,
          timestamp: new Date(),
        });
      }

      setCurrentSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedAgent || !agentAliasId) {
      setError('Please select an agent first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // If no session exists, start one with this message
      if (!currentSession) {
        await startNewSession(message);
        return;
      }

      // Add user message to current session
      const userMessage: ConversationMessage = {
        id: generateMessageId(),
        content: message,
        isUser: true,
        timestamp: new Date(),
      };

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMessage]
      } : undefined);

      // Send message to agent
      const response = await AgentRouterAPI.sendMessage(
        selectedAgent.agentId,
        agentAliasId,
        {
          message,
          sessionId: currentSession.sessionId,
        }
      );

      // Add agent response
      const agentMessage: ConversationMessage = {
        id: generateMessageId(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
      };

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, agentMessage]
      } : undefined);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSession(undefined);
    setError(null);
  };

  const isReady = selectedAgent && agentAliasId;

  return (
    <div className="agent-search">
      <div className="header">
        <h2>🤖 AI Agent Chat</h2>
        <p>Select an agent and start a conversation</p>
      </div>

      <AgentSelector
        onAgentSelect={handleAgentSelect}
        selectedAgent={selectedAgent}
        disabled={isLoading}
      />

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} className="dismiss-error">
            ✕
          </button>
        </div>
      )}

      {isReady && (
        <div className="chat-section">
          <div className="chat-header">
            <div className="session-info">
              {currentSession ? (
                <>
                  <span className="session-status">🟢 Active Session</span>
                  <span className="session-id">ID: {currentSession.sessionId}</span>
                </>
              ) : (
                <span className="session-status">💬 Ready to Chat</span>
              )}
            </div>
            {currentSession && (
              <button onClick={handleNewChat} className="new-chat-button">
                🔄 New Chat
              </button>
            )}
          </div>

          <ChatInterface
            messages={currentSession?.messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!isReady}
            placeholder={`Message ${selectedAgent?.agentName || 'agent'}...`}
          />
        </div>
      )}

      {!isReady && (
        <div className="setup-message">
          <p>👆 Please select an agent and provide an alias ID to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default AgentSearch;