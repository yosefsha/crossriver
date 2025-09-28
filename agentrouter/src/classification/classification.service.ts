import { Injectable, Logger } from '@nestjs/common';
import { BedrockService } from '../agent/bedrock.service';
import { ConfigService } from '@nestjs/config';
import { QueryAnalysis } from '../orchestrator/types/orchestrator.types';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  
  // Using the provided agent and alias IDs
  private readonly classifierAgentId = 'BZUOBKBE6S';
  private readonly classifierAliasId = 'IQZX8OVP9I';

  constructor(
    private readonly bedrockService: BedrockService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Classify a user query using dedicated Bedrock classification agent
   * 
   * @param query - User's original query text
   * @returns QueryAnalysis with selected agent and confidence scores
   */
  async classifyQuery(query: string): Promise<QueryAnalysis> {
    this.logger.log(`Classifying query: "${query}"`);
    
    try {
      // Call the classification agent
      const result = await this.bedrockService.invokeAgent(
        this.classifierAgentId,
        this.classifierAliasId,
        query,
        `classification-${Date.now()}`
      );
      
      // Parse and validate the response
      let classificationResult;
      try {
        // First try to parse as JSON
        classificationResult = JSON.parse(result.response);
        this.logger.log(`Classification result (JSON): ${JSON.stringify(classificationResult)}`);
      } catch (parseError) {
        // If parsing fails, the agent might have returned natural language instead of JSON
        this.logger.warn(`Failed to parse classification result as JSON: ${parseError.message}`);
        this.logger.warn(`Raw response: ${result.response}`);
        
        // Extract classification data from the text response
        classificationResult = this.extractClassificationFromText(query, result.response);
        this.logger.log(`Extracted classification result: ${JSON.stringify(classificationResult)}`);
      }
      
      if (!classificationResult || !classificationResult.target_specialist || !classificationResult.routing_confidence) {
        this.logger.warn(`Invalid classification result: ${JSON.stringify(classificationResult)}`);
        throw new Error('Invalid classification data format');
      }
      
      // Map the model's output format to our QueryAnalysis structure
      // From the example output:
      // { "needs_clarification": true, "question": "...", "proposed_default": "...", "target_specialist": "finance", "routing_confidence": 0.65, "rationale": "..." }
      
      // Map specialist names to agent IDs
      const specialistToAgentMap = {
        'technical': 'technical-specialist',
        'business': 'business-analyst',
        'creative': 'creative-specialist',
        'data': 'data-scientist',
        'finance': 'financial-analyst',
        'general': 'general-assistant'
      };
      
      // Get the selected agent ID from target_specialist
      const targetSpecialist = classificationResult.target_specialist || 'general';
      const selectedAgent = specialistToAgentMap[targetSpecialist] || 'general-assistant';
      
      // Create confidence scores object with the target specialist having the given confidence
      const confidenceScores = {};
      const routingConfidence = classificationResult.routing_confidence;
      
      // Set the confidence for the selected agent
      confidenceScores[selectedAgent] = routingConfidence;
      
      // Add lower confidences for other agents as fallbacks
      Object.keys(specialistToAgentMap).forEach(specialist => {
        const agentId = specialistToAgentMap[specialist];
        if (agentId !== selectedAgent) {
          confidenceScores[agentId] = Math.max(0.1, routingConfidence * 0.3);
        }
      });
      
      // Map to QueryAnalysis structure
      const analysis: QueryAnalysis = {
        original_query: query,
        analyzed_intent: classificationResult.proposed_default || query,
        confidence_scores: confidenceScores,
        selected_agent: selectedAgent,
        reasoning: classificationResult.rationale || 'No reasoning provided',
        keywords_matched: []
      };
      
      this.logger.log(`Classification completed. Selected agent: ${analysis.selected_agent}`);
      this.logger.log(`Confidence scores: ${JSON.stringify(analysis.confidence_scores)}`);
      
      return analysis;
    } catch (error) {
      this.logger.error(`Classification failed: ${error.message}`);
      throw new Error(`Classification error: ${error.message}`);
    }
  }
  
  /**
   * Records classification metrics for monitoring and optimization
   * 
   * @param query - Original query text
   * @param result - Classification result
   * @param durationMs - Processing time in milliseconds
   */
  private recordClassificationMetrics(query: string, result: QueryAnalysis, durationMs: number): void {
    // Future implementation will include:
    // 1. Classification latency tracking
    // 2. Selected agent distribution
    // 3. Confidence score distributions
    // 4. Classification errors
  }
  
  /**
   * Extract classification data from text when the agent doesn't return valid JSON
   * 
   * This method uses heuristics to determine the most likely specialist
   * based on the content of the response and the original query
   * 
   * @param query - Original query text
   * @param response - Raw text response from classification agent
   * @returns Classification data in the expected format
   */
  private extractClassificationFromText(query: string, response: string): any {
    this.logger.log(`Extracting classification from text response for query: "${query}"`);
    
    // Keywords that indicate a specific specialist domain
    const domainKeywords = {
      technical: [
        'code', 'docker', 'dockerfile', 'kubernetes', 'aws', 'cloud', 'devops', 
        'programming', 'development', 'api', 'backend', 'frontend', 'database',
        'architecture', 'infrastructure', 'deployment', 'git', 'ci/cd'
      ],
      business: [
        'mvp', 'plan', 'milestone', 'risk', 'strategy', 'stakeholder',
        'roi', 'cost', 'benefit', 'project management', 'roadmap', 'timeline',
        'requirement', 'user story', 'product', 'market', 'customer'
      ],
      creative: [
        'design', 'copy', 'content', 'brand', 'marketing', 'social media',
        'cta', 'hook', 'post', 'campaign', 'visual', 'logo', 'color palette',
        'voice', 'messaging', 'audience'
      ],
      data: [
        'data', 'model', 'algorithm', 'machine learning', 'analytics',
        'statistic', 'random forest', 'gradient boosting', 'prediction',
        'classification', 'regression', 'clustering', 'feature', 'dataset'
      ],
      finance: [
        'finance', 'investment', 'cash flow', 'dcf', 'roi', 'wacc',
        'bond', 'stock', 'etf', 'portfolio', 'tax', 'margin', 'revenue',
        'profit', 'asset', 'liability', 'balance sheet'
      ]
    };
    
    // Lowercase everything for case-insensitive matching
    const queryLower = query.toLowerCase();
    const responseLower = response.toLowerCase();
    
    // Score each specialist based on keyword matches in query and response
    const domainScores: Record<string, number> = {};
    
    // Calculate scores for each domain based on keyword matches
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      // Score based on query keywords (higher weight)
      const queryScore = keywords.reduce((score, keyword) => {
        return queryLower.includes(keyword.toLowerCase()) ? score + 2 : score;
      }, 0);
      
      // Score based on response keywords (lower weight)
      const responseScore = keywords.reduce((score, keyword) => {
        return responseLower.includes(keyword.toLowerCase()) ? score + 1 : score;
      }, 0);
      
      // Total score for this domain
      domainScores[domain] = queryScore + responseScore;
    }
    
    // Find the domain with the highest score
    let bestDomain = 'general';
    let highestScore = -1;
    
    for (const [domain, score] of Object.entries(domainScores)) {
      if (score > highestScore) {
        highestScore = score;
        bestDomain = domain;
      }
    }
    
    // If no clear winner, default to general
    if (highestScore === 0) {
      bestDomain = 'general';
    }
    
    // Calculate confidence based on the score margin
    // Higher scores and bigger margins = higher confidence
    const scores = Object.values(domainScores) as number[];
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / scores.length;
    
    // Calculate confidence between 0.6 and 0.9
    // Higher score and higher difference from average = higher confidence
    const confidence = Math.min(0.9, Math.max(0.6, 0.6 + (highestScore / (avg + 1)) * 0.3));
    
    this.logger.log(`Domain scores: ${JSON.stringify(domainScores)}`);
    this.logger.log(`Best domain: ${bestDomain}, confidence: ${confidence}`);
    
    // Generate a default response that matches the expected format
    return {
      needs_clarification: false,
      question: query,
      proposed_default: query,
      target_specialist: bestDomain,
      routing_confidence: confidence,
      rationale: `Determined from content analysis of the response`
    };
  }
}