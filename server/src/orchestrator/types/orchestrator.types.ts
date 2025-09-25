// Types for the Agent Orchestrator System

export interface AgentSpecialization {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  keywords: string[];
  domains: string[];
  confidence_threshold: number;
}

export interface OrchestrationConfig {
  orchestrator_agent_id: string;
  orchestrator_alias_id: string;
  specialized_agents: AgentSpecialization[];
  routing_strategy: 'confidence' | 'keywords' | 'hybrid';
  fallback_agent_id?: string;
}

export interface QueryAnalysis {
  analyzed_intent: string;
  keywords_matched: string[];
  domain_indicators: string[];
  confidence_scores: { [agentId: string]: number };
  selected_agent: string;
  reasoning: string;
  context_influence: number;
}

export interface OrchestrationContext {
  session_id: string;
  user_query: string;
  conversation_history: ConversationStep[];
  current_agent?: string;
  routing_decisions: QueryAnalysis[];
  created_at: Date;
  last_activity: Date;
  message_count: number;
}

export interface ConversationStep {
  timestamp: Date;
  user_message: string;
  agent_id: string;
  agent_response: string;
  routing_reason: string;
}

export interface OrchestrationResponse {
  response: string;
  handling_agent: string;
  agent_name: string;
  routing_analysis: QueryAnalysis;
  session_id: string;
  processing_time_ms: number;
  timestamp: Date;
}

export interface RoutingDecision {
  selected_agent: string;
  confidence_score: number;
  alternatives: Array<{
    agent: string;
    score: number;
    reasoning: string;
  }>;
  decision_factors: {
    keyword_match: number;
    domain_relevance: number;
    context_continuity: number;
    agent_availability: number;
  };
  explanation: string;
}