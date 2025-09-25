import React, { useState } from 'react';
import { QueryAnalysis } from '../types/orchestrator.types';
import './RoutingDisplay.css';

interface RoutingDisplayProps {
  routing_analysis: QueryAnalysis;
  agent_name: string;
  compact?: boolean;
  showDetails?: boolean;
}

const RoutingDisplay: React.FC<RoutingDisplayProps> = ({
  routing_analysis,
  agent_name,
  compact = false,
  showDetails = false
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return '#10b981'; // green
    if (score >= 0.6) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getIntentIcon = (intent: string): string => {
    const icons: { [key: string]: string } = {
      'help_request': '🙋‍♂️',
      'creation_request': '🔨',
      'analysis_request': '📊',
      'learning_request': '📚',
      'troubleshooting': '🔧',
      'optimization_request': '⚡',
      'planning_request': '📋',
      'comparison_request': '⚖️',
      'recommendation_request': '💡',
      'general_inquiry': '💬'
    };
    return icons[intent] || '💬';
  };

  const selectedScore = routing_analysis.confidence_scores[routing_analysis.selected_agent] || 0;

  if (compact) {
    return (
      <div className="routing-compact">
        <div className="specialist-badge">
          <span className="specialist-icon">🤖</span>
          <span className="specialist-name">{agent_name}</span>
          <span 
            className="confidence-score"
            style={{ color: getConfidenceColor(selectedScore) }}
          >
            {(selectedScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="routing-display">
      <div className="routing-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="specialist-info">
          <span className="specialist-icon">🤖</span>
          <div className="specialist-details">
            <span className="specialist-name">{agent_name}</span>
            <span className="intent-badge">
              {getIntentIcon(routing_analysis.analyzed_intent)}
              {routing_analysis.analyzed_intent.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="confidence-info">
          <span 
            className="confidence-score"
            style={{ color: getConfidenceColor(selectedScore) }}
          >
            {(selectedScore * 100).toFixed(0)}%
          </span>
          <span className="expand-icon">{isExpanded ? '🔽' : '🔼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="routing-details">
          <div className="detail-section">
            <h4>🎯 Why this specialist?</h4>
            <p className="reasoning">{routing_analysis.reasoning}</p>
          </div>

          {routing_analysis.keywords_matched.length > 0 && (
            <div className="detail-section">
              <h4>🔑 Matched Keywords</h4>
              <div className="keywords-list">
                {routing_analysis.keywords_matched.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h4>📊 All Specialist Scores</h4>
            <div className="confidence-scores">
              {Object.entries(routing_analysis.confidence_scores)
                .sort(([,a], [,b]) => b - a)
                .map(([agentId, score]) => (
                  <div 
                    key={agentId} 
                    className={`score-item ${agentId === routing_analysis.selected_agent ? 'selected' : ''}`}
                  >
                    <span className="agent-id">{agentId.replace('-', ' ')}</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill"
                        style={{ 
                          width: `${score * 100}%`,
                          backgroundColor: getConfidenceColor(score)
                        }}
                      />
                    </div>
                    <span className="score-value">{(score * 100).toFixed(0)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutingDisplay;