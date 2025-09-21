import React, { useState, useRef, useEffect } from 'react';
import { OrchestratorConversationMessage } from '../types/orchestrator.types';
import RoutingDisplay from './RoutingDisplay';
import './OrchestratorChatInterface.css';

interface OrchestratorChatInterfaceProps {
  messages: OrchestratorConversationMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showRoutingDetails?: boolean;
}

const OrchestratorChatInterface: React.FC<OrchestratorChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Ask anything - I'll route you to the right specialist...",
  showRoutingDetails = true
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading && !disabled) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getExampleQueries = () => [
    { icon: '💻', query: "How do I optimize React performance?", specialist: "Technical" },
    { icon: '📊', query: "What's the ROI of our automation project?", specialist: "Business" },
    { icon: '🎨', query: "How can we improve our brand messaging?", specialist: "Creative" },
    { icon: '📈', query: "How do I analyze customer churn patterns?", specialist: "Data Science" }
  ];

  return (
    <div className="orchestrator-chat-interface">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-section">
            <div className="welcome-header">
              <h2>🎯 Smart Agent Orchestrator</h2>
              <p>Ask any question and I'll automatically route you to the best specialist!</p>
            </div>
            
            <div className="example-queries">
              <h3>Try these examples:</h3>
              <div className="query-examples">
                {getExampleQueries().map((example, index) => (
                  <button
                    key={index}
                    className="example-query"
                    onClick={() => setInputMessage(example.query)}
                    disabled={disabled || isLoading}
                  >
                    <span className="example-icon">{example.icon}</span>
                    <div className="example-content">
                      <div className="example-text">{example.query}</div>
                      <div className="example-specialist">→ {example.specialist} Specialist</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="message-wrapper">
              <div className={`message ${message.isUser ? 'user-message' : 'agent-message'}`}>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  <div className="message-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
              
              {/* Show routing info for agent messages */}
              {!message.isUser && message.routing_info && showRoutingDetails && (
                <RoutingDisplay
                  routing_analysis={{
                    original_query: '', // We don't store this in message
                    analyzed_intent: message.routing_info.intent,
                    confidence_scores: { [message.routing_info.handling_agent]: message.routing_info.confidence_score },
                    selected_agent: message.routing_info.handling_agent,
                    reasoning: message.routing_info.reasoning,
                    keywords_matched: message.routing_info.keywords_matched
                  }}
                  agent_name={message.routing_info.agent_name}
                  compact={false}
                  showDetails={false}
                />
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="message-wrapper">
            <div className="message agent-message">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="loading-text">
                  Analyzing your query and routing to the best specialist...
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="message-input"
            rows={1}
            style={{
              minHeight: '44px',
              resize: 'none',
              overflow: 'hidden'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || disabled}
            className="send-button"
          >
            {isLoading ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              <span className="send-icon">🚀</span>
            )}
          </button>
        </div>
        
        {inputMessage.trim() && (
          <div className="input-help">
            <span className="help-icon">💡</span>
            <span className="help-text">
              I'll analyze your query and route it to the most appropriate specialist
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default OrchestratorChatInterface;