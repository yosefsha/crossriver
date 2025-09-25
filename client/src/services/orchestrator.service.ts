import { AgentRouterAPI } from './agentRouter.service';
import { authService } from './auth.service';
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
    const response = await authService.authenticatedFetch(`${ORCHESTRATOR_API_BASE_URL}/query`, {
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
    const response = await authService.authenticatedFetch(`${ORCHESTRATOR_API_BASE_URL}/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: initialMessage
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to start orchestrated session: ${response.statusText} - ${errorText}`);
    }
    return response.json();
  }

  /**
   * Get available agent specialists
   */
  static async getSpecialists(): Promise<AgentSpecialization[]> {
    const response = await authService.authenticatedFetch(`${ORCHESTRATOR_API_BASE_URL}/agents`);
    if (!response.ok) {
      throw new Error(`Failed to fetch specialists: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(sessionId: string): Promise<any> {
    const response = await authService.authenticatedFetch(`${ORCHESTRATOR_API_BASE_URL}/session/${sessionId}/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch session stats: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get orchestrator configuration and status
   */
  static async getOrchestratorStatus(): Promise<{
    is_active: boolean;
    available_agents: any[];
    active_sessions: number;
    uptime_seconds: number;
    version: string;
  }> {
    const response = await authService.authenticatedFetch(`${ORCHESTRATOR_API_BASE_URL}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get orchestrator status: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Clear a session
   */
  static async clearSession(sessionId: string): Promise<void> {
    const response = await authService.authenticatedFetch(`${ORCHESTRATOR_API_BASE_URL}/session/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to clear session: ${response.statusText}`);
    }
  }

  /**
   * Get health status
   */
  static async getHealth(): Promise<any> {
    const response = await authService.authenticatedFetch(`${ORCHESTRATOR_API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Failed to get health status: ${response.statusText}`);
    }
    return response.json();
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
      'financial-analyst': '�',
      'data-scientist': '📊',
      'business-analyst': '📈',
      'creative-specialist': '🎨'
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