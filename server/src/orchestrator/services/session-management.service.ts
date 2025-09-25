import { Injectable, Logger } from '@nestjs/common';
import { OrchestrationContext, ConversationStep, QueryAnalysis } from '../types/orchestrator.types';

/**
 * SessionManagementService - Manages conversation state and context
 * 
 * This service specializes in:
 * 1. Session lifecycle management (create, update, cleanup)
 * 2. Conversation history tracking and analysis
 * 3. Context extraction for improved routing decisions
 * 4. Session persistence and memory management
 */
@Injectable()
export class SessionManagementService {
  private readonly logger = new Logger(SessionManagementService.name);
  
  // In-memory session storage (in production, use Redis or database)
  private readonly sessions = new Map<string, OrchestrationContext>();
  
  // Configuration
  private readonly MAX_CONVERSATION_HISTORY = 50; // Limit memory usage
  private readonly SESSION_TIMEOUT_HOURS = 24;    // Auto-cleanup after 24h
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Cleanup every hour

  constructor() {
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Get or create a conversation context for the given session
   * 
   * @param sessionId - Unique session identifier
   * @param userQuery - Current user query
   * @returns Promise<OrchestrationContext> - Complete session context
   */
  async getOrCreateContext(sessionId: string, userQuery: string): Promise<OrchestrationContext> {
    this.logger.log(`📝 Managing context for session: ${sessionId}`);

    try {
      let context = this.sessions.get(sessionId);

      if (!context) {
        // Create new session context
        context = this.createNewContext(sessionId, userQuery);
        this.sessions.set(sessionId, context);
        this.logger.log(`✨ Created new session context: ${sessionId}`);
      } else {
        // Update existing context
        context = this.updateContext(context, userQuery);
        this.sessions.set(sessionId, context);
        this.logger.log(`🔄 Updated existing session context: ${sessionId}`);
      }

      return context;

    } catch (error) {
      this.logger.error(`Session management failed: ${error.message}`);
      throw new Error(`Failed to manage session: ${error.message}`);
    }
  }

  /**
   * Add a conversation step to the session history
   * 
   * @param sessionId - Session identifier
   * @param userMessage - User's message
   * @param agentId - ID of the handling agent
   * @param agentResponse - Agent's response
   * @param routingAnalysis - Routing decision details
   */
  async addConversationStep(
    sessionId: string,
    userMessage: string,
    agentId: string,
    agentResponse: string,
    routingAnalysis: QueryAnalysis
  ): Promise<void> {
    const context = this.sessions.get(sessionId);
    if (!context) {
      this.logger.warn(`Attempted to add step to non-existent session: ${sessionId}`);
      return;
    }

    const step: ConversationStep = {
      timestamp: new Date(),
      user_message: userMessage,
      agent_id: agentId,
      agent_response: agentResponse,
      routing_reason: routingAnalysis.reasoning
    };

    context.conversation_history.push(step);
    context.routing_decisions.push(routingAnalysis);
    context.current_agent = agentId;
    context.last_activity = new Date();
    context.message_count++;

    // Trim history if it gets too long
    this.trimConversationHistory(context);

    this.sessions.set(sessionId, context);
    this.logger.debug(`Added conversation step to session ${sessionId}: ${agentId}`);
  }

  /**
   * Extract conversation context for routing decisions
   * 
   * @param sessionId - Session identifier
   * @returns string[] - Relevant context messages for analysis
   */
  getConversationContext(sessionId: string): string[] {
    const context = this.sessions.get(sessionId);
    if (!context || context.conversation_history.length === 0) {
      return [];
    }

    // Return last 5 user messages for context analysis
    return context.conversation_history
      .slice(-5)
      .map(step => step.user_message);
  }

  /**
   * Get session statistics for monitoring
   * 
   * @param sessionId - Session identifier
   * @returns Session metrics and analytics
   */
  getSessionStats(sessionId: string): {
    messageCount: number;
    agentSwitches: number;
    sessionDuration: number;
    mostUsedAgent: string;
    lastActivity: Date;
  } | null {
    const context = this.sessions.get(sessionId);
    if (!context) return null;

    const agentUsage = new Map<string, number>();
    let agentSwitches = 0;
    let previousAgent: string | undefined;

    // Analyze conversation history
    for (const step of context.conversation_history) {
      // Count agent usage
      const count = agentUsage.get(step.agent_id) || 0;
      agentUsage.set(step.agent_id, count + 1);

      // Count agent switches
      if (previousAgent && previousAgent !== step.agent_id) {
        agentSwitches++;
      }
      previousAgent = step.agent_id;
    }

    // Find most used agent
    let mostUsedAgent = '';
    let maxUsage = 0;
    for (const [agent, count] of agentUsage.entries()) {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsedAgent = agent;
      }
    }

    const sessionDuration = context.last_activity.getTime() - context.created_at.getTime();

    return {
      messageCount: context.message_count,
      agentSwitches,
      sessionDuration,
      mostUsedAgent,
      lastActivity: context.last_activity
    };
  }

  /**
   * Clear a specific session
   * 
   * @param sessionId - Session to clear
   * @returns boolean - Success status
   */
  clearSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.logger.log(`🗑️ Cleared session: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Get all active sessions (for monitoring)
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get total number of active sessions
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Create a new session context
   */
  private createNewContext(sessionId: string, userQuery: string): OrchestrationContext {
    return {
      session_id: sessionId,
      user_query: userQuery,
      conversation_history: [],
      routing_decisions: [],
      created_at: new Date(),
      last_activity: new Date(),
      message_count: 0
    };
  }

  /**
   * Update existing session context
   */
  private updateContext(context: OrchestrationContext, userQuery: string): OrchestrationContext {
    return {
      ...context,
      user_query: userQuery,
      last_activity: new Date()
    };
  }

  /**
   * Trim conversation history to prevent memory bloat
   */
  private trimConversationHistory(context: OrchestrationContext): void {
    if (context.conversation_history.length > this.MAX_CONVERSATION_HISTORY) {
      // Keep only the most recent conversations
      const excessCount = context.conversation_history.length - this.MAX_CONVERSATION_HISTORY;
      context.conversation_history.splice(0, excessCount);
      context.routing_decisions.splice(0, excessCount);
      
      this.logger.debug(`Trimmed ${excessCount} old messages from session ${context.session_id}`);
    }
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL_MS);

    this.logger.log('🧹 Started periodic session cleanup');
  }

  /**
   * Remove sessions that have been inactive for too long
   */
  private cleanupExpiredSessions(): void {
    const now = new Date().getTime();
    const timeoutMs = this.SESSION_TIMEOUT_HOURS * 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const [sessionId, context] of this.sessions.entries()) {
      const inactiveTime = now - context.last_activity.getTime();
      
      if (inactiveTime > timeoutMs) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }
  }
}