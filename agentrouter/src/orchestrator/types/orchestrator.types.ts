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
  original_query: string;
  analyzed_intent: string;
  confidence_scores: { [agentId: string]: number };
  selected_agent: string;
  reasoning: string;
  keywords_matched: string[];
}

export interface OrchestrationContext {
  session_id: string;
  user_query: string;
  conversation_history: ConversationStep[];
  current_agent?: string;
  routing_decisions: QueryAnalysis[];
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
  context_maintained?: boolean;
}

export interface AgentInfo {
  agent_id: string;
  name: string;
  domains: string[];
  description: string;
}

export interface StatusResponse {
  is_active: boolean;
  available_agents: AgentInfo[];
  active_sessions: number;
  uptime_seconds: number;
  version: string;
  session_id?: string;
  context_maintained?: boolean;
}

export interface AgentRoutingRule {
  agent_id: string;
  trigger_patterns: string[];
  exclusion_patterns?: string[];
  priority: number;
  requires_context?: boolean;
}