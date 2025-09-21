import { Injectable, Logger } from '@nestjs/common';
import { BedrockService } from '../agent/bedrock.service';
import { ORCHESTRATOR_CONFIG } from './config/orchestrator.config';
import { 
  QueryAnalysis, 
  OrchestrationContext, 
  OrchestrationResponse,
  AgentSpecialization 
} from './types/orchestrator.types';

/**
 * OrchestratorService - The brain of the multi-agent system
 * 
 * This service acts as an intelligent router that:
 * 1. Analyzes incoming user queries to understand intent and domain
 * 2. Scores each specialized agent based on relevance to the query
 * 3. Routes queries to the most appropriate specialized agent
 * 4. Maintains conversation context across multiple exchanges
 * 5. Provides explainable reasoning for all routing decisions
 * 
 * The orchestration process reduces hallucinations by ensuring queries
 * are handled by agents specifically trained for their domain.
 */
@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly config = ORCHESTRATOR_CONFIG;

  constructor(private readonly bedrockService: BedrockService) {}

  /**
   * Main orchestration method - the entry point for all user queries
   * 
   * @param query - The user's question or request
   * @param sessionId - Unique session identifier for context tracking
   * @param context - Optional conversation history and state
   * @returns Promise<OrchestrationResponse> - Complete response with routing metadata
   */
  async orchestrateQuery(
    query: string, 
    sessionId: string, 
    context?: OrchestrationContext
  ): Promise<OrchestrationResponse> {
    this.logger.log(`🎯 Orchestrating query: "${query}" for session: ${sessionId}`);

    try {
      // STEP 1: QUERY ANALYSIS
      // Analyze the query to determine the best specialized agent
      // This involves keyword matching, domain scoring, and context analysis
      const analysis = await this.analyzeQuery(query, context);
      
      this.logger.log(`📊 Query analysis completed. Selected agent: ${analysis.selected_agent}`);
      this.logger.log(`📈 Confidence scores: ${JSON.stringify(analysis.confidence_scores)}`);

      // STEP 2: AGENT LOOKUP
      // Find the configuration for the selected specialized agent
      const selectedAgent = this.config.specialized_agents.find(
        agent => agent.id === analysis.selected_agent
      );

      if (!selectedAgent) {
        throw new Error(`Selected agent ${analysis.selected_agent} not found in configuration`);
      }

      // STEP 3: AGENT INVOCATION
      // Invoke the selected specialized agent with the original query
      // Context is passed along to maintain conversation continuity
      const agentResponse = await this.invokeSpecializedAgent(
        selectedAgent,
        query,
        sessionId,
        analysis,
        context
      );

      // STEP 4: RESPONSE PACKAGING
      // Package the response with full routing metadata for transparency
      const orchestrationResponse: OrchestrationResponse = {
        response: agentResponse.response,
        handling_agent: selectedAgent.id,
        agent_name: selectedAgent.name,
        routing_analysis: analysis,
        session_id: sessionId,
        context_maintained: !!context
      };

      this.logger.log(`✅ Orchestration completed successfully for agent: ${selectedAgent.name}`);
      return orchestrationResponse;

    } catch (error) {
      this.logger.error(`❌ Orchestration failed for query: ${query}`, error);
      
      // FALLBACK STRATEGY
      // If routing fails, try to use a fallback agent rather than failing completely
      if (this.config.fallback_agent_id) {
        return this.handleFallback(query, sessionId, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Query Analysis Engine - The core intelligence of the orchestrator
   * 
   * This method implements a multi-factor scoring algorithm that considers:
   * - Keyword relevance (60% weight) - Direct keyword matches in the query
   * - Domain patterns (20% weight) - Broader domain-specific language patterns  
   * - Context continuity (20% weight) - Preference for continuing with current agent
   * 
   * @param query - The user's query text
   * @param context - Optional conversation context for continuity scoring
   * @returns Promise<QueryAnalysis> - Detailed analysis with scores and reasoning
   */
  private async analyzeQuery(
    query: string, 
    context?: OrchestrationContext
  ): Promise<QueryAnalysis> {
    const queryLower = query.toLowerCase();
    const confidenceScores: { [agentId: string]: number } = {};

    // MULTI-AGENT SCORING
    // Calculate confidence scores for each specialized agent
    // Higher scores indicate better fit for handling the query
    for (const agent of this.config.specialized_agents) {
      confidenceScores[agent.id] = this.calculateAgentConfidence(queryLower, agent, context);
    }

    // WINNER SELECTION
    // Find the agent with the highest confidence score
    const selectedAgent = Object.entries(confidenceScores)
      .reduce((best, [agentId, score]) => 
        score > best.score ? { agentId, score } : best, 
        { agentId: '', score: 0 }
      );

    // THRESHOLD VALIDATION
    // Ensure the winning agent meets the minimum confidence threshold
    // This prevents routing to agents that aren't truly suitable
    const bestAgent = this.config.specialized_agents.find(a => a.id === selectedAgent.agentId);
    const meetsThreshold = selectedAgent.score >= (bestAgent?.confidence_threshold || 0.5);

    // ANALYSIS RESULT PACKAGING
    const analysis: QueryAnalysis = {
      original_query: query,
      analyzed_intent: this.extractIntent(queryLower),
      confidence_scores: confidenceScores,
      selected_agent: meetsThreshold ? selectedAgent.agentId : (this.config.fallback_agent_id || 'general-assistant'),
      reasoning: this.generateReasoningExplanation(selectedAgent, confidenceScores, meetsThreshold),
      keywords_matched: this.extractMatchedKeywords(queryLower, bestAgent)
    };

    return analysis;
  }

  /**
   * Multi-Factor Confidence Scoring Algorithm
   * 
   * This algorithm combines three factors to determine how well-suited
   * an agent is for handling a particular query:
   * 
   * 1. Keyword Matching (60%) - Direct matches with agent's keyword list
   * 2. Domain Relevance (20%) - Broader domain pattern recognition
   * 3. Context Continuity (20%) - Bonus for continuing with current agent
   * 
   * @param queryLower - Normalized query text (lowercase)
   * @param agent - Agent specialization configuration
   * @param context - Optional conversation context
   * @returns number - Confidence score (0.0 to 1.0+)
   */
  private calculateAgentConfidence(
    queryLower: string, 
    agent: AgentSpecialization,
    context?: OrchestrationContext
  ): number {
    let score = 0;
    
    // SCORING WEIGHTS
    // These weights determine the relative importance of each factor
    const weights = {
      keywords: 0.6,    // Primary factor - direct keyword relevance
      domains: 0.2,     // Secondary factor - domain pattern matching
      context: 0.2      // Tertiary factor - conversation continuity
    };

    // FACTOR 1: KEYWORD MATCHING (60% of total score)
    // Count how many of the agent's keywords appear in the query
    const keywordMatches = agent.keywords.filter(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
    const keywordScore = Math.min(keywordMatches.length / 3, 1); // Normalize to 0-1, diminishing returns after 3 matches
    score += keywordScore * weights.keywords;

    // FACTOR 2: DOMAIN RELEVANCE (20% of total score)
    // Look for broader domain-specific language patterns
    const domainScore = this.calculateDomainRelevance(queryLower, agent.domains);
    score += domainScore * weights.domains;

    // FACTOR 3: CONTEXT CONTINUITY (20% of total score)
    // Bonus for continuing with the same agent to maintain coherent conversations
    const contextScore = this.calculateContextRelevance(agent.id, context);
    score += contextScore * weights.context;

    // EXACT MATCH BONUS
    // Additional boost for exact keyword matches (whole word boundaries)
    // This helps distinguish between "java" (programming) and "java script" (partial match)
    const exactMatches = agent.keywords.filter(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
      return regex.test(queryLower);
    });
    score += exactMatches.length * 0.1; // 10% bonus per exact match

    return Math.min(score, 1.2); // Cap at 1.2 to allow some bonus scoring
  }

  /**
   * Domain Pattern Recognition
   * 
   * This method looks for broader linguistic patterns that indicate
   * domain expertise beyond just keyword matching. For example:
   * - "build", "develop", "create" suggest software development
   * - "analyze", "predict", "model" suggest data science
   * - "campaign", "promote", "brand" suggest marketing
   * 
   * @param queryLower - Normalized query text
   * @param domains - Agent's domain specializations
   * @returns number - Domain relevance score (0.0 to 1.0)
   */
  private calculateDomainRelevance(queryLower: string, domains: string[]): number {
    // DOMAIN PATTERN DICTIONARY
    // Maps domain names to action verbs and conceptual terms commonly used in that domain
    const domainPatterns = {
      'software_development': ['build', 'develop', 'create', 'implement', 'code', 'program', 'write'],
      'devops': ['deploy', 'pipeline', 'infrastructure', 'container', 'server', 'automate', 'scale'],
      'cloud_computing': ['aws', 'azure', 'cloud', 'serverless', 'kubernetes', 'docker', 'microservices'],
      'cybersecurity': ['secure', 'encrypt', 'authenticate', 'vulnerability', 'threat', 'firewall'],
      'business_strategy': ['strategy', 'plan', 'business', 'market', 'growth', 'competitive', 'revenue'],
      'project_management': ['project', 'timeline', 'milestone', 'stakeholder', 'scope', 'deliverable'],
      'financial_analysis': ['financial', 'budget', 'cost', 'roi', 'investment', 'profit', 'revenue'],
      'data_science': ['analyze', 'predict', 'model', 'statistics', 'insights', 'correlation', 'trend'],
      'machine_learning': ['train', 'algorithm', 'neural', 'classification', 'regression', 'feature'],
      'analytics': ['dashboard', 'metrics', 'kpi', 'visualization', 'report', 'measurement'],
      'content_creation': ['write', 'create', 'design', 'content', 'copy', 'article', 'blog'],
      'marketing': ['campaign', 'promote', 'brand', 'audience', 'engagement', 'conversion'],
      'design': ['visual', 'layout', 'interface', 'user experience', 'wireframe', 'prototype'],
      'communications': ['message', 'communicate', 'presentation', 'social media', 'public relations']
    };

    let relevanceScore = 0;
    
    // PATTERN MATCHING
    // For each domain the agent specializes in, check if the query contains related patterns
    for (const domain of domains) {
      const patterns = domainPatterns[domain] || [];
      const matches = patterns.filter(pattern => queryLower.includes(pattern));
      
      // Score contribution: 0.3 for any matches in this domain, diminishing returns
      if (matches.length > 0) {
        relevanceScore += Math.min(matches.length * 0.1, 0.3);
      }
    }

    return Math.min(relevanceScore, 1);
  }

  /**
   * Context Continuity Scoring
   * 
   * Provides a bonus score for continuing with the same agent to maintain
   * conversational coherence. This helps avoid unnecessary agent switching
   * when the user is deep in a technical discussion.
   * 
   * @param agentId - The agent being evaluated
   * @param context - Current conversation context
   * @returns number - Context continuity score (0.0 to 0.3)
   */
  private calculateContextRelevance(agentId: string, context?: OrchestrationContext): number {
    if (!context || !context.current_agent) {
      return 0; // No context bonus for new conversations
    }

    // CONTINUITY BONUS
    // If the user is continuing with the same agent, provide a moderate boost
    // This prevents unnecessary switching in the middle of coherent conversations
    return context.current_agent === agentId ? 0.3 : 0;
  }

  /**
   * Intent Classification Engine
   * 
   * Classifies the user's query into high-level intent categories.
   * This helps provide additional context for routing decisions and
   * can be used for analytics and improvement.
   * 
   * @param queryLower - Normalized query text
   * @returns string - Classified intent category
   */
  private extractIntent(queryLower: string): string {
    // INTENT PATTERN MAPPING
    // Maps intent categories to trigger words commonly used in that type of request
    const intentPatterns = {
      'help_request': ['help', 'assist', 'support', 'guide', 'how to', 'can you'],
      'creation_request': ['create', 'build', 'make', 'develop', 'generate', 'design', 'write'],
      'analysis_request': ['analyze', 'examine', 'review', 'assess', 'evaluate', 'compare'],
      'learning_request': ['learn', 'understand', 'explain', 'teach', 'show', 'what is', 'why'],
      'troubleshooting': ['fix', 'debug', 'solve', 'resolve', 'error', 'problem', 'issue', 'broken'],
      'optimization_request': ['improve', 'optimize', 'enhance', 'better', 'faster', 'efficient'],
      'planning_request': ['plan', 'strategy', 'roadmap', 'schedule', 'timeline', 'approach']
    };

    // INTENT DETECTION
    // Find the first intent category that matches patterns in the query
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => queryLower.includes(pattern))) {
        return intent;
      }
    }

    return 'general_inquiry'; // Default fallback intent
  }

  /**
   * Keyword Extraction for Transparency
   * 
   * Extracts the specific keywords that influenced the routing decision.
   * This provides transparency and helps users understand why a particular
   * agent was selected.
   * 
   * @param queryLower - Normalized query text
   * @param agent - Selected agent configuration
   * @returns string[] - List of matched keywords
   */
  private extractMatchedKeywords(queryLower: string, agent?: AgentSpecialization): string[] {
    if (!agent) return [];
    
    return agent.keywords.filter(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
  }

  /**
   * Routing Decision Explanation Generator
   * 
   * Generates human-readable explanations for routing decisions.
   * This is crucial for building trust and allowing users to understand
   * why they were routed to a particular specialist.
   * 
   * @param selectedAgent - The winning agent and score
   * @param allScores - All confidence scores for comparison
   * @param meetsThreshold - Whether the winner met minimum confidence
   * @returns string - Human-readable explanation
   */
  private generateReasoningExplanation(
    selectedAgent: { agentId: string; score: number },
    allScores: { [agentId: string]: number },
    meetsThreshold: boolean
  ): string {
    const agentConfig = this.config.specialized_agents.find(a => a.id === selectedAgent.agentId);
    const agentName = agentConfig?.name || selectedAgent.agentId;

    // THRESHOLD FAILURE EXPLANATION
    if (!meetsThreshold) {
      return `No specialized agent met the confidence threshold (${agentConfig?.confidence_threshold || 0.5}). Using fallback agent to ensure you get help.`;
    }

    // SUCCESS EXPLANATION WITH COMPETITIVE ANALYSIS
    const sortedScores = Object.entries(allScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3); // Show top 3 candidates

    const reasonParts = [
      `Selected ${agentName} with confidence score ${selectedAgent.score.toFixed(2)} (threshold: ${agentConfig?.confidence_threshold || 0.5}).`,
      `Top candidates: ${sortedScores.map(([id, score]) => {
        const name = this.config.specialized_agents.find(a => a.id === id)?.name || id;
        return `${name} (${score.toFixed(2)})`;
      }).join(', ')}.`
    ];

    return reasonParts.join(' ');
  }

  /**
   * Specialized Agent Invocation
   * 
   * This method handles the actual invocation of the selected specialized agent.
   * It enhances the query with conversation context and manages the interaction
   * with the underlying Bedrock service.
   * 
   * @param agent - The selected agent configuration
   * @param query - Original user query
   * @param sessionId - Session identifier for context
   * @param analysis - The routing analysis that led to this selection
   * @param context - Optional conversation history
   * @returns Promise<any> - Response from the specialized agent
   */
  private async invokeSpecializedAgent(
    agent: AgentSpecialization,
    query: string,
    sessionId: string,
    analysis: QueryAnalysis,
    context?: OrchestrationContext
  ) {
    // AGENT MAPPING
    // In a production system, you would map specialization IDs to actual Bedrock agent IDs
    // For now, we use the specialization ID as the Bedrock agent ID
    const bedrockAgentId = agent.id;
    const agentAliasId = 'TSTALIASID'; // Default alias - should be configurable per agent

    this.logger.log(`🤖 Invoking ${agent.name} (${bedrockAgentId}) for query: ${query}`);

    // CONTEXT ENHANCEMENT
    // If this is part of an ongoing conversation, enhance the query with relevant history
    // This helps the specialized agent understand the conversation flow
    let enhancedQuery = query;
    if (context?.conversation_history?.length > 0) {
      const recentHistory = context.conversation_history.slice(-2); // Last 2 exchanges for context
      const contextSummary = recentHistory.map(step => 
        `Previous: ${step.user_message} -> ${step.agent_response.substring(0, 100)}...`
      ).join(' ');
      
      enhancedQuery = `Context: ${contextSummary}\n\nCurrent question: ${query}`;
      this.logger.log(`📝 Enhanced query with conversation context`);
    }

    // AGENT INVOCATION
    // Call the underlying Bedrock service with the enhanced query
    return await this.bedrockService.invokeAgent(
      bedrockAgentId,
      agentAliasId,
      enhancedQuery,
      sessionId
    );
  }

  /**
   * Fallback Handler - Graceful Degradation
   * 
   * When the primary routing system fails, this method provides a graceful
   * fallback response rather than completely failing the user's request.
   * This ensures system reliability even when individual components fail.
   * 
   * @param query - Original user query
   * @param sessionId - Session identifier
   * @param errorMessage - Description of what went wrong
   * @returns Promise<OrchestrationResponse> - Fallback response
   */
  private async handleFallback(
    query: string,
    sessionId: string,
    errorMessage: string
  ): Promise<OrchestrationResponse> {
    this.logger.warn(`⚠️ Using fallback agent due to error: ${errorMessage}`);

    // FALLBACK RESPONSE CONSTRUCTION
    // Provide a helpful response that acknowledges the issue but still attempts to help
    const fallbackResponse: OrchestrationResponse = {
      response: `I encountered an issue with my routing system (${errorMessage}), but I'll do my best to help with your request: "${query}". Please let me know if you need me to try a different approach.`,
      handling_agent: this.config.fallback_agent_id || 'general-assistant',
      agent_name: 'General Assistant (Fallback)',
      routing_analysis: {
        original_query: query,
        analyzed_intent: 'fallback',
        confidence_scores: {},
        selected_agent: this.config.fallback_agent_id || 'general-assistant',
        reasoning: `Fallback due to routing error: ${errorMessage}`,
        keywords_matched: []
      },
      session_id: sessionId,
      context_maintained: false
    };

    return fallbackResponse;
  }
}