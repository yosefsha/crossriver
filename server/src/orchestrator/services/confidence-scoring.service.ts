import { Injectable, Logger } from '@nestjs/common';
import { QueryAnalysis, RoutingDecision, AgentSpecialization } from '../types/orchestrator.types';
import { ORCHESTRATOR_CONFIG } from '../config/orchestrator.config';

/**
 * ConfidenceScoringService - Calculates confidence scores for agent routing
 * 
 * This service specializes in:
 * 1. Multi-factor confidence scoring (keywords, domain, context)
 * 2. Weighted scoring algorithms for optimal agent selection
 * 3. Alternative agent ranking and explanation generation
 * 4. Confidence threshold validation
 */
@Injectable()
export class ConfidenceScoringService {
  private readonly logger = new Logger(ConfidenceScoringService.name);
  private readonly config = ORCHESTRATOR_CONFIG;

  // Scoring weights for multi-factor analysis
  private readonly WEIGHTS = {
    KEYWORD_MATCH: 0.6,    // 60% - Direct keyword relevance
    DOMAIN_RELEVANCE: 0.2, // 20% - Domain specialization
    CONTEXT_CONTINUITY: 0.2 // 20% - Conversation context
  };

  /**
   * Calculate confidence scores for all agents and make routing decision
   * 
   * @param analysis - Query analysis with intent and keywords
   * @param conversationHistory - Previous agent interactions
   * @returns Promise<RoutingDecision> - Complete routing decision with alternatives
   */
  async calculateRoutingDecision(
    analysis: QueryAnalysis,
    conversationHistory: string[] = []
  ): Promise<RoutingDecision> {
    this.logger.log(`🎯 Calculating routing decision for intent: ${analysis.analyzed_intent}`);

    try {
      const scores: { [agentId: string]: number } = {};
      const alternatives: Array<{agent: string; score: number; reasoning: string}> = [];

      // Calculate confidence scores for each specialist agent
      for (const agent of this.config.specialized_agents) {
        const score = this.calculateAgentScore(agent, analysis, conversationHistory);
        scores[agent.id] = score;
        
        alternatives.push({
          agent: agent.id,
          score: score,
          reasoning: this.generateScoreReasoning(agent, score, analysis)
        });
      }

      // Sort alternatives by score (highest first)
      alternatives.sort((a, b) => b.score - a.score);

      // Select the best agent
      const selectedAgent = alternatives[0];
      
      // Validate confidence threshold
      const selectedAgentConfig = this.config.specialized_agents.find(
        a => a.id === selectedAgent.agent
      );

      if (!selectedAgentConfig || selectedAgent.score < selectedAgentConfig.confidence_threshold) {
        this.logger.warn(`Low confidence score: ${selectedAgent.score}, falling back to general assistant`);
        return this.createFallbackDecision(alternatives, analysis);
      }

      // Calculate decision factors breakdown
      const decisionFactors = this.calculateDecisionFactors(
        selectedAgentConfig, 
        analysis, 
        conversationHistory
      );

      return {
        selected_agent: selectedAgent.agent,
        confidence_score: selectedAgent.score,
        alternatives: alternatives.slice(1), // Exclude the selected agent
        decision_factors: decisionFactors,
        explanation: this.generateDecisionExplanation(
          selectedAgentConfig, 
          selectedAgent.score, 
          analysis
        )
      };

    } catch (error) {
      this.logger.error(`Confidence scoring failed: ${error.message}`);
      throw new Error(`Failed to calculate routing decision: ${error.message}`);
    }
  }

  /**
   * Calculate confidence score for a specific agent
   */
  private calculateAgentScore(
    agent: AgentSpecialization,
    analysis: QueryAnalysis,
    conversationHistory: string[]
  ): number {
    // Factor 1: Keyword Match Score (60%)
    const keywordScore = this.calculateKeywordScore(agent, analysis.keywords_matched);
    
    // Factor 2: Domain Relevance Score (20%)
    const domainScore = this.calculateDomainScore(agent, analysis.domain_indicators);
    
    // Factor 3: Context Continuity Score (20%)
    const contextScore = this.calculateContextScore(agent, conversationHistory);

    // Weighted total score
    const totalScore = (
      keywordScore * this.WEIGHTS.KEYWORD_MATCH +
      domainScore * this.WEIGHTS.DOMAIN_RELEVANCE +
      contextScore * this.WEIGHTS.CONTEXT_CONTINUITY
    );

    this.logger.debug(
      `Agent ${agent.id}: keyword=${keywordScore.toFixed(2)}, ` +
      `domain=${domainScore.toFixed(2)}, context=${contextScore.toFixed(2)}, ` +
      `total=${totalScore.toFixed(2)}`
    );

    return Math.min(totalScore, 1.0); // Cap at 1.0
  }

  /**
   * Calculate keyword match score for an agent
   */
  private calculateKeywordScore(agent: AgentSpecialization, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    let matchCount = 0;
    for (const keyword of keywords) {
      if (agent.keywords.some(agentKeyword => 
        agentKeyword.toLowerCase() === keyword.toLowerCase()
      )) {
        matchCount++;
      }
    }

    return matchCount / keywords.length;
  }

  /**
   * Calculate domain relevance score for an agent
   */
  private calculateDomainScore(agent: AgentSpecialization, domains: string[]): number {
    if (domains.length === 0) return 0;

    let matchCount = 0;
    for (const domain of domains) {
      if (agent.domains.includes(domain)) {
        matchCount++;
      }
    }

    return matchCount / domains.length;
  }

  /**
   * Calculate context continuity score (prefers same agent if context is related)
   */
  private calculateContextScore(agent: AgentSpecialization, conversationHistory: string[]): number {
    if (conversationHistory.length === 0) return 0.5; // Neutral score for new conversations

    // Simple implementation: check if agent ID appears in recent history
    const recentHistory = conversationHistory.slice(-3).join(' ').toLowerCase();
    const agentMentioned = recentHistory.includes(agent.id) || 
                          recentHistory.includes(agent.name.toLowerCase());

    return agentMentioned ? 0.8 : 0.3; // Boost for context continuity
  }

  /**
   * Generate reasoning for a specific agent's score
   */
  private generateScoreReasoning(
    agent: AgentSpecialization, 
    score: number, 
    analysis: QueryAnalysis
  ): string {
    const matchedKeywords = analysis.keywords_matched.filter(keyword =>
      agent.keywords.some(agentKeyword => 
        agentKeyword.toLowerCase() === keyword.toLowerCase()
      )
    );

    return `Score: ${(score * 100).toFixed(1)}% - Matched keywords: ${matchedKeywords.join(', ') || 'none'}`;
  }

  /**
   * Calculate detailed breakdown of decision factors
   */
  private calculateDecisionFactors(
    agent: AgentSpecialization,
    analysis: QueryAnalysis,
    conversationHistory: string[]
  ): RoutingDecision['decision_factors'] {
    return {
      keyword_match: this.calculateKeywordScore(agent, analysis.keywords_matched),
      domain_relevance: this.calculateDomainScore(agent, analysis.domain_indicators),
      context_continuity: this.calculateContextScore(agent, conversationHistory),
      agent_availability: 1.0 // All agents are always available in our model
    };
  }

  /**
   * Generate human-readable explanation for the routing decision
   */
  private generateDecisionExplanation(
    agent: AgentSpecialization,
    score: number,
    analysis: QueryAnalysis
  ): string {
    const percentage = (score * 100).toFixed(1);
    const matchedKeywords = analysis.keywords_matched.filter(keyword =>
      agent.keywords.some(agentKeyword => 
        agentKeyword.toLowerCase() === keyword.toLowerCase()
      )
    );

    return `Selected ${agent.name} with ${percentage}% confidence. ` +
           `Key factors: ${matchedKeywords.length} matching keywords (${matchedKeywords.join(', ')}) ` +
           `and domain expertise in ${agent.domains.join(', ')}.`;
  }

  /**
   * Create fallback decision when no agent meets confidence threshold
   */
  private createFallbackDecision(
    alternatives: Array<{agent: string; score: number; reasoning: string}>,
    analysis: QueryAnalysis
  ): RoutingDecision {
    const fallbackAgent = this.config.fallback_agent_id || 'general-assistant';
    
    return {
      selected_agent: fallbackAgent,
      confidence_score: 0.5, // Default fallback confidence
      alternatives: alternatives,
      decision_factors: {
        keyword_match: 0.2,
        domain_relevance: 0.1,
        context_continuity: 0.2,
        agent_availability: 1.0
      },
      explanation: `No specialist met confidence threshold. Routing to general assistant for intent: ${analysis.analyzed_intent}`
    };
  }
}