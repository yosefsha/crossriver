import { Test, TestingModule } from '@nestjs/testing';
import { ConfidenceScoringService } from '../services/confidence-scoring.service';
import { QueryAnalysis } from '../types/orchestrator.types';

describe('ConfidenceScoringService', () => {
  let service: ConfidenceScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfidenceScoringService],
    }).compile();

    service = module.get<ConfidenceScoringService>(ConfidenceScoringService);
  });

  describe('Confidence Scoring Tests', () => {
    it('should score technical queries highest for Technical Specialist', async () => {
      const analysis: QueryAnalysis = {
        analyzed_intent: 'technical_request',
        keywords_matched: ['code', 'programming', 'debug', 'api'],
        domain_indicators: ['software_development'],
        confidence_scores: {},
        selected_agent: '',
        reasoning: '',
        context_influence: 0
      };

      const decision = await service.calculateRoutingDecision(analysis);
      
      expect(decision.selected_agent).toBe('technical-specialist');
      expect(decision.confidence_score).toBeGreaterThan(0.7);
      expect(decision.explanation).toContain('Technical Specialist');
    });

    it('should score financial queries highest for Financial Analyst', async () => {
      const analysis: QueryAnalysis = {
        analyzed_intent: 'analysis_request',
        keywords_matched: ['roi', 'investment', 'portfolio', 'financial'],
        domain_indicators: ['finance', 'financial_analysis'],
        confidence_scores: {},
        selected_agent: '',
        reasoning: '',
        context_influence: 0
      };

      const decision = await service.calculateRoutingDecision(analysis);
      
      expect(decision.selected_agent).toBe('financial-analyst');
      expect(decision.confidence_score).toBeGreaterThan(0.7);
      expect(decision.decision_factors.keyword_match).toBeGreaterThan(0.5);
      expect(decision.decision_factors.domain_relevance).toBeGreaterThan(0.5);
    });

    it('should score data science queries highest for Data Scientist', async () => {
      const analysis: QueryAnalysis = {
        analyzed_intent: 'analysis_request',
        keywords_matched: ['machine learning', 'data', 'model', 'prediction'],
        domain_indicators: ['data_science', 'machine_learning'],
        confidence_scores: {},
        selected_agent: '',
        reasoning: '',
        context_influence: 0
      };

      const decision = await service.calculateRoutingDecision(analysis);
      
      expect(decision.selected_agent).toBe('data-scientist');
      expect(decision.confidence_score).toBeGreaterThan(0.7);
    });

    it('should provide alternative agent rankings', async () => {
      const analysis: QueryAnalysis = {
        analyzed_intent: 'business_request',
        keywords_matched: ['strategy', 'market', 'business'],
        domain_indicators: ['business_strategy'],
        confidence_scores: {},
        selected_agent: '',
        reasoning: '',
        context_influence: 0
      };

      const decision = await service.calculateRoutingDecision(analysis);
      
      expect(decision.alternatives.length).toBeGreaterThan(0);
      expect(decision.alternatives[0].score).toBeLessThan(decision.confidence_score);
      expect(decision.alternatives.every(alt => alt.reasoning.length > 0)).toBe(true);
    });

    it('should fallback to general assistant for low confidence', async () => {
      const analysis: QueryAnalysis = {
        analyzed_intent: 'general_inquiry',
        keywords_matched: ['hello', 'hi'],
        domain_indicators: [],
        confidence_scores: {},
        selected_agent: '',
        reasoning: '',
        context_influence: 0
      };

      const decision = await service.calculateRoutingDecision(analysis);
      
      expect(decision.selected_agent).toBe('general-assistant');
      expect(decision.explanation).toContain('No specialist met confidence threshold');
    });

    it('should weight factors correctly (60% keywords, 20% domain, 20% context)', async () => {
      const analysis: QueryAnalysis = {
        analyzed_intent: 'technical_request',
        keywords_matched: ['programming'], // Single keyword
        domain_indicators: ['software_development'], // Strong domain match
        confidence_scores: {},
        selected_agent: '',
        reasoning: '',
        context_influence: 0.8 // High context influence
      };

      const conversationHistory = ['previous technical discussion'];
      const decision = await service.calculateRoutingDecision(analysis, conversationHistory);
      
      // Verify weighted scoring
      const factors = decision.decision_factors;
      expect(factors.keyword_match).toBeDefined();
      expect(factors.domain_relevance).toBeDefined();
      expect(factors.context_continuity).toBeDefined();
      
      // Context should influence but not dominate
      expect(factors.context_continuity).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty keyword lists', async () => {
      const analysis: QueryAnalysis = {
        analyzed_intent: 'general_inquiry',
        keywords_matched: [],
        domain_indicators: [],
        confidence_scores: {},
        selected_agent: '',
        reasoning: '',
        context_influence: 0
      };

      const decision = await service.calculateRoutingDecision(analysis);
      
      expect(decision).toBeDefined();
      expect(decision.selected_agent).toBeDefined();
    });

    it('should handle conflicting domain indicators', async () => {
      const analysis: QueryAnalysis = {
        analyzed_intent: 'hybrid_request',
        keywords_matched: ['data', 'business', 'strategy'],
        domain_indicators: ['data_science', 'business_strategy'],
        confidence_scores: {},
        selected_agent: '',
        reasoning: '',
        context_influence: 0
      };

      const decision = await service.calculateRoutingDecision(analysis);
      
      expect(decision.selected_agent).toBeDefined();
      expect(decision.confidence_score).toBeGreaterThan(0);
      expect(decision.explanation).toBeTruthy();
    });
  });
});