import { Injectable, Logger } from '@nestjs/common';
import { QueryAnalysisService } from './query-analysis.service';
import { ConfidenceScoringService } from './confidence-scoring.service';
import { SessionManagementService } from './session-management.service';
import { BedrockService } from './bedrock.service';
import { OrchestrationResponse, QueryAnalysis } from '../types/orchestrator.types';
import { ORCHESTRATOR_CONFIG } from '../config/orchestrator.config';

/**
 * OrchestratorService - The main coordinator for the multi-agent system
 * 
 * This service acts as the orchestration controller that:
 * 1. Coordinates between specialized analysis services
 * 2. Manages the overall orchestration workflow
 * 3. Handles system prompt generation for runtime specialization
 * 4. Provides the main API interface for orchestrated conversations
 * 
 * This is a much cleaner, focused service that delegates specific
 * responsibilities to dedicated service classes.
 */
@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly config = ORCHESTRATOR_CONFIG;

  constructor(
    private readonly queryAnalysisService: QueryAnalysisService,
    private readonly confidenceScoringService: ConfidenceScoringService,
    private readonly sessionManagementService: SessionManagementService,
    private readonly bedrockService: BedrockService
  ) {}

  /**
   * Main orchestration method - coordinates the entire routing and response process
   * 
   * @param query - The user's question or request
   * @param sessionId - Unique session identifier for context tracking
   * @returns Promise<OrchestrationResponse> - Complete response with routing metadata
   */
  async orchestrateQuery(query: string, sessionId: string): Promise<OrchestrationResponse> {
    this.logger.log(`🎯 Orchestrating query: "${query}" for session: ${sessionId}`);
    const startTime = Date.now();

    try {
      // STEP 1: SESSION MANAGEMENT
      // Get or create conversation context for this session
      const context = await this.sessionManagementService.getOrCreateContext(sessionId, query);
      const conversationHistory = this.sessionManagementService.getConversationContext(sessionId);
      
      this.logger.debug(`📝 Session context loaded: ${conversationHistory.length} previous messages`);

      // STEP 2: QUERY ANALYSIS
      // Analyze the user query to understand intent and extract keywords
      const analysis = await this.queryAnalysisService.analyzeQuery(query, conversationHistory);
      
      this.logger.debug(
        `🔍 Query analysis complete: intent="${analysis.analyzed_intent}", ` +
        `keywords=[${analysis.keywords_matched.join(', ')}], ` +
        `domains=[${analysis.domain_indicators.join(', ')}]`
      );

      // STEP 3: ROUTING DECISION
      // Calculate confidence scores and select the best agent
      const routingDecision = await this.confidenceScoringService.calculateRoutingDecision(
        analysis, 
        conversationHistory
      );

      this.logger.log(
        `🎯 Routing decision: ${routingDecision.selected_agent} ` +
        `(confidence: ${(routingDecision.confidence_score * 100).toFixed(1)}%)`
      );

      // STEP 4: AGENT RESPONSE
      // Get the selected agent configuration and generate response
      const selectedAgentConfig = this.config.specialized_agents.find(
        agent => agent.id === routingDecision.selected_agent
      );

      if (!selectedAgentConfig) {
        throw new Error(`Selected agent not found: ${routingDecision.selected_agent}`);
      }

      // Generate runtime system prompt for this specialist
      const systemPrompt = this.buildSpecialistSystemPrompt(selectedAgentConfig, analysis);
      
      // Get response from Bedrock using the specialized system prompt
      const response = await this.bedrockService.invokeAgent(
        this.config.orchestrator_agent_id,
        this.config.orchestrator_alias_id,
        query,
        sessionId,
        systemPrompt
      );

      // STEP 5: SESSION UPDATE
      // Update conversation history with this exchange
      const finalAnalysis: QueryAnalysis = {
        ...analysis,
        confidence_scores: { [routingDecision.selected_agent]: routingDecision.confidence_score },
        selected_agent: routingDecision.selected_agent,
        reasoning: routingDecision.explanation
      };

      await this.sessionManagementService.addConversationStep(
        sessionId,
        query,
        routingDecision.selected_agent,
        response.response,
        finalAnalysis
      );

      // STEP 6: RESPONSE COMPOSITION
      const processingTime = Date.now() - startTime;
      
      const orchestrationResponse: OrchestrationResponse = {
        response: response.response,
        handling_agent: routingDecision.selected_agent,
        agent_name: selectedAgentConfig.name,
        routing_analysis: finalAnalysis,
        session_id: sessionId,
        processing_time_ms: processingTime,
        timestamp: new Date()
      };

      this.logger.log(
        `✅ Orchestration complete: ${processingTime}ms, ` +
        `agent=${selectedAgentConfig.name}, ` +
        `confidence=${(routingDecision.confidence_score * 100).toFixed(1)}%`
      );

      return orchestrationResponse;

    } catch (error) {
      this.logger.error(`Orchestration failed: ${error.message}`);
      throw new Error(`Orchestration failed: ${error.message}`);
    }
  }

  /**
   * Start a new orchestrated session with an initial message
   * 
   * @param initialMessage - First message to start the conversation
   * @returns Promise<OrchestrationResponse> - Response with new session ID
   */
  async startOrchestratedSession(initialMessage: string): Promise<OrchestrationResponse> {
    const sessionId = this.generateSessionId();
    this.logger.log(`🚀 Starting new orchestrated session: ${sessionId}`);
    
    return this.orchestrateQuery(initialMessage, sessionId);
  }

  /**
   * Get orchestrator status and available agents
   */
  getOrchestratorStatus(): {
    isActive: boolean;
    availableAgents: Array<{
      id: string;
      name: string;
      description: string;
      domains: string[];
    }>;
    activeSessions: number;
    version: string;
  } {
    return {
      isActive: true,
      availableAgents: this.config.specialized_agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        domains: agent.domains
      })),
      activeSessions: this.sessionManagementService.getActiveSessionCount(),
      version: '1.0.0'
    };
  }

  /**
   * Clear a specific session
   */
  clearSession(sessionId: string): boolean {
    return this.sessionManagementService.clearSession(sessionId);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    return this.sessionManagementService.getSessionStats(sessionId);
  }

  /**
   * Build a specialized system prompt for the selected agent
   * This is where the "Runtime System Prompts" magic happens!
   */
  private buildSpecialistSystemPrompt(
    agentConfig: any,
    analysis: QueryAnalysis
  ): string {
    return `You are ${agentConfig.name}, ${agentConfig.description}

SPECIALIST CAPABILITIES:
${agentConfig.capabilities.map((cap: string) => `• ${cap}`).join('\n')}

BEHAVIORAL INSTRUCTIONS:
• Respond as an expert in your specialized domains: ${agentConfig.domains.join(', ')}
• Focus on providing detailed, actionable insights within your expertise area
• If the query is outside your specialization, acknowledge this and provide what relevant context you can
• Use professional language appropriate for your field
• Provide practical, implementable solutions when possible
• Reference industry best practices and standards

CURRENT CONTEXT:
• User query intent: ${analysis.analyzed_intent}
• Key topics identified: ${analysis.keywords_matched.join(', ')}
• Domain areas: ${analysis.domain_indicators.join(', ')}

Remember: You are a ${agentConfig.name} - maintain this specialized identity throughout the conversation while providing helpful, expert-level guidance.`;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}