// Orchestrator-specific types extending the base agent types
import { ConversationMessage, ChatSession, Agent } from './agent.types';

export interface OrchestratorResponse {
  response: string;
  handling_agent: string;
  agent_name: string;
  routing_analysis: QueryAnalysis;
  session_id: string;
  context_maintained: boolean;
}

export interface QueryAnalysis {
  original_query: string;
  analyzed_intent: string;
  confidence_scores: { [agentId: string]: number };
  selected_agent: string;
  reasoning: string;
  keywords_matched: string[];
}

export interface AgentSpecialization {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  keywords: string[];
  domains: string[];
  confidence_threshold: number;
}

export interface OrchestratorConversationMessage extends ConversationMessage {
  routing_info?: {
    handling_agent: string;
    agent_name: string;
    confidence_score: number;
    reasoning: string;
    keywords_matched: string[];
    intent: string;
  };
}

export interface OrchestratorSession extends ChatSession {
  orchestrator_enabled: boolean;
  routing_history: QueryAnalysis[];
  specialist_switches: number;
}

// Agent selector modes
export type AgentMode = 'direct' | 'orchestrator';

export interface AgentModeConfig {
  mode: AgentMode;
  selectedAgent?: Agent;
  agentAliasId?: string;
  showRoutingDetails?: boolean;
}