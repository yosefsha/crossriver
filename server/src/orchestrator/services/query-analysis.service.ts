import { Injectable, Logger } from '@nestjs/common';
import { QueryAnalysis } from '../types/orchestrator.types';
import { ORCHESTRATOR_CONFIG } from '../config/orchestrator.config';

/**
 * QueryAnalysisService - Responsible for understanding user intent
 * 
 * This service specializes in:
 * 1. Intent classification and keyword extraction
 * 2. Domain identification from user queries
 * 3. Context-aware query preprocessing
 * 4. Semantic analysis and topic detection
 */
@Injectable()
export class QueryAnalysisService {
  private readonly logger = new Logger(QueryAnalysisService.name);
  private readonly config = ORCHESTRATOR_CONFIG;

  /**
   * Analyze a user query to extract intent, keywords, and domain indicators
   * 
   * @param query - The user's question or request
   * @param conversationHistory - Previous messages for context
   * @returns Promise<QueryAnalysis> - Structured analysis of the query
   */
  async analyzeQuery(
    query: string, 
    conversationHistory: string[] = []
  ): Promise<QueryAnalysis> {
    this.logger.log(`🔍 Analyzing query: "${query}"`);

    try {
      // Extract keywords using NLP patterns
      const keywords = this.extractKeywords(query);
      
      // Identify domain indicators
      const domainIndicators = this.identifyDomains(query, keywords);
      
      // Classify intent based on query patterns
      const intent = this.classifyIntent(query, keywords);
      
      // Factor in conversation context
      const contextInfluence = this.calculateContextInfluence(
        query, 
        conversationHistory
      );

      return {
        analyzed_intent: intent,
        keywords_matched: keywords,
        domain_indicators: domainIndicators,
        confidence_scores: {}, // Will be calculated by ConfidenceScorer
        selected_agent: '', // Will be determined by AgentRouter
        reasoning: `Intent: ${intent}, Domains: ${domainIndicators.join(', ')}`,
        context_influence: contextInfluence
      };

    } catch (error) {
      this.logger.error(`Query analysis failed: ${error.message}`);
      throw new Error(`Failed to analyze query: ${error.message}`);
    }
  }

  /**
   * Extract meaningful keywords from the user query
   */
  private extractKeywords(query: string): string[] {
    const normalizedQuery = query.toLowerCase();
    const keywords: string[] = [];

    // Check against all specialist keywords
    for (const agent of this.config.specialized_agents) {
      for (const keyword of agent.keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          keywords.push(keyword);
        }
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Identify domain areas based on query content
   */
  private identifyDomains(query: string, keywords: string[]): string[] {
    const domains: string[] = [];
    const normalizedQuery = query.toLowerCase();

    for (const agent of this.config.specialized_agents) {
      let domainMatch = false;

      // Check domain-specific patterns
      for (const domain of agent.domains) {
        if (normalizedQuery.includes(domain.replace('_', ' ')) || 
            keywords.some(kw => agent.keywords.includes(kw))) {
          domains.push(domain);
          domainMatch = true;
        }
      }

      // Additional semantic matching
      if (!domainMatch && this.hasSemanticMatch(query, agent.description)) {
        domains.push(...agent.domains);
      }
    }

    return [...new Set(domains)];
  }

  /**
   * Classify the intent of the user query
   */
  private classifyIntent(query: string, keywords: string[]): string {
    const normalizedQuery = query.toLowerCase();

    // Question patterns
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    if (questionWords.some(word => normalizedQuery.startsWith(word))) {
      return 'information_request';
    }

    // Task patterns
    const taskWords = ['create', 'build', 'generate', 'make', 'develop', 'design'];
    if (taskWords.some(word => normalizedQuery.includes(word))) {
      return 'task_request';
    }

    // Analysis patterns
    const analysisWords = ['analyze', 'examine', 'review', 'evaluate', 'assess'];
    if (analysisWords.some(word => normalizedQuery.includes(word))) {
      return 'analysis_request';
    }

    // Help patterns
    const helpWords = ['help', 'assist', 'support', 'guide'];
    if (helpWords.some(word => normalizedQuery.includes(word))) {
      return 'assistance_request';
    }

    return 'general_inquiry';
  }

  /**
   * Calculate how much conversation context should influence routing
   */
  private calculateContextInfluence(
    query: string, 
    conversationHistory: string[]
  ): number {
    if (conversationHistory.length === 0) return 0;

    // Calculate context relevance (0-1 scale)
    const recentMessages = conversationHistory.slice(-3); // Last 3 messages
    let contextScore = 0;

    for (const message of recentMessages) {
      const commonWords = this.findCommonWords(query, message);
      if (commonWords.length > 0) {
        contextScore += commonWords.length * 0.1;
      }
    }

    return Math.min(contextScore, 1.0);
  }

  /**
   * Check for semantic matches between query and agent description
   */
  private hasSemanticMatch(query: string, description: string): boolean {
    const queryWords = query.toLowerCase().split(/\s+/);
    const descWords = description.toLowerCase().split(/\s+/);
    
    const commonWords = queryWords.filter(word => 
      word.length > 3 && descWords.includes(word)
    );

    return commonWords.length >= 2;
  }

  /**
   * Find common meaningful words between two strings
   */
  private findCommonWords(str1: string, str2: string): string[] {
    const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    return words1.filter(word => words2.includes(word));
  }
}