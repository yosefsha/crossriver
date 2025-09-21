import { AgentRouterAPI } from './agentRouter.service';
import { 
  OrchestratorResponse, 
  AgentSpecialization,
  QueryAnalysis
} from '../types/orchestrator.types';
import { Agent } from '../types/agent.types';

const ORCHESTRATOR_API_BASE_URL = '/agents/orchestrator';

export class OrchestratorAPI extends AgentRouterAPI {
  
  /**
   * Send a query through the orchestrator for intelligent routing
   */
  static async orchestrateQuery(
    query: string,
    sessionId?: string
  ): Promise<OrchestratorResponse> {
    const response = await fetch(`${ORCHESTRATOR_API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        sessionId: sessionId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to orchestrate query: ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }

  /**
   * Start a new orchestrated conversation session
   */
  static async startOrchestratedSession(
    initialMessage?: string
  ): Promise<OrchestratorResponse> {
    const response = await fetch(`${ORCHESTRATOR_API_BASE_URL}/start-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initialMessage: initialMessage
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to start orchestrated session: ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }

  /**
   * Get available specialist configurations
   */
  static async getSpecialists(): Promise<AgentSpecialization[]> {
    const response = await fetch(`${ORCHESTRATOR_API_BASE_URL}/specialists`);
    if (!response.ok) {
      throw new Error(`Failed to fetch specialists: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get conversation context for a session
   */
  static async getConversationContext(sessionId: string): Promise<any> {
    const response = await fetch(`${ORCHESTRATOR_API_BASE_URL}/context/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch conversation context: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Preview what prompt would be generated for a specialist and query
   * (Debug/testing utility)
   */
  static async previewSpecializationPrompt(
    specialistId: string,
    query: string
  ): Promise<string> {
    const response = await fetch(`${ORCHESTRATOR_API_BASE_URL}/preview-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        specialistId: specialistId,
        query: query
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to preview prompt: ${response.statusText}`);
    }
    const result = await response.json();
    return result.prompt;
  }

  /**
   * Analyze a query without executing it
   * (Useful for showing routing predictions)
   */
  static async analyzeQuery(query: string): Promise<QueryAnalysis> {
    const response = await fetch(`${ORCHESTRATOR_API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze query: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get orchestrator configuration and status
   */
  static async getOrchestratorStatus(): Promise<{
    enabled: boolean;
    specialists: AgentSpecialization[];
    routing_strategy: string;
    fallback_agent?: string;
  }> {
    const response = await fetch(`${ORCHESTRATOR_API_BASE_URL}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get orchestrator status: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Clear conversation context for a session
   */
  static async clearContext(sessionId: string): Promise<void> {
    const response = await fetch(`${ORCHESTRATOR_API_BASE_URL}/context/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to clear context: ${response.statusText}`);
    }
  }

  // Utility methods for UI components

  /**
   * Format confidence score for display
   */
  static formatConfidenceScore(score: number): string {
    return `${(score * 100).toFixed(0)}%`;
  }

  /**
   * Get specialist emoji based on specialist ID
   */
  static getSpecialistEmoji(specialistId: string): string {
    const emojiMap: { [key: string]: string } = {
      'technical-specialist': '💻',
      'business-analyst': '📊',
      'creative-specialist': '🎨',
      'data-scientist': '📈'
    };
    return emojiMap[specialistId] || '🤖';
  }

  /**
   * Get confidence color based on score
   */
  static getConfidenceColor(score: number): string {
    if (score >= 0.8) return '#10b981'; // green
    if (score >= 0.6) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  /**
   * Determine if orchestrator should be used vs direct agent
   */
  static shouldUseOrchestrator(query: string): boolean {
    // Simple heuristics - in practice this could be more sophisticated
    const orchestratorKeywords = [
      'help', 'how', 'what', 'why', 'analyze', 'create', 'optimize',
      'strategy', 'design', 'develop', 'improve', 'recommend'
    ];
    
    const queryLower = query.toLowerCase();
    return orchestratorKeywords.some(keyword => queryLower.includes(keyword));
  }
}