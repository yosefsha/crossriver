// Agent Router API types
export interface Agent {
  agentId: string;
  agentName: string;
  agentStatus: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentResponse {
  sessionId: string;
  response: string;
  contentType: string;
}

export interface ChatMessage {
  message: string;
  sessionId?: string;
}

export interface StartSessionRequest {
  initialMessage?: string;
}

export interface ConversationMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatSession {
  sessionId: string;
  agentId: string;
  agentAliasId: string;
  agentName?: string;
  messages: ConversationMessage[];
  isActive: boolean;
  createdAt: Date;
}