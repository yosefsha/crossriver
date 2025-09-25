import { Agent, AgentResponse, ChatMessage, StartSessionRequest } from '../types/agent.types';

const API_BASE_URL = '/agents';

export class AgentRouterAPI {
  
  /**
   * Get all available Bedrock agents
   */
  static async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get agent details by ID
   */
  static async getAgent(agentId: string): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/${agentId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agent: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Start a new conversation session with an agent
   */
  static async startSession(
    agentId: string, 
    agentAliasId: string, 
    request: StartSessionRequest = {}
  ): Promise<AgentResponse> {
    const response = await fetch(`${API_BASE_URL}/${agentId}/${agentAliasId}/start-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to start session: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Send a message to an agent
   */
  static async sendMessage(
    agentId: string, 
    agentAliasId: string, 
    message: ChatMessage
  ): Promise<AgentResponse> {
    const response = await fetch(`${API_BASE_URL}/${agentId}/${agentAliasId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Check agent router service health
   */
  static async getHealth(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Failed to get health status: ${response.statusText}`);
    }
    return response.json();
  }
}