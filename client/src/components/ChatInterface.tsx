import React, { useState, useRef, useEffect } from 'react';
import { ConversationMessage } from '../types/agent.types';
import './ChatInterface.css';

interface ChatInterfaceProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Type your message here..."
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

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>👋 Welcome! Start a conversation with the selected agent.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'agent-message'}`}
            >
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message agent-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
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
              minHeight: '40px',
              maxHeight: '120px',
              resize: 'none',
              overflow: 'auto'
            }}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || disabled || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;