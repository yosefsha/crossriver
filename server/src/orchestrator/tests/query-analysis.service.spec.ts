import { Test, TestingModule } from '@nestjs/testing';
import { QueryAnalysisService } from '../services/query-analysis.service';
import { ORCHESTRATOR_CONFIG } from '../config/orchestrator.config';

describe('QueryAnalysisService', () => {
  let service: QueryAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryAnalysisService],
    }).compile();

    service = module.get<QueryAnalysisService>(QueryAnalysisService);
  });

  describe('Query Analysis Tests', () => {
    it('should extract technical keywords correctly', async () => {
      const query = 'How do I optimize my SQL database performance?';
      const analysis = await service.analyzeQuery(query);

      expect(analysis.keywords_matched).toContain('database');
      expect(analysis.keywords_matched).toContain('sql');
      expect(analysis.keywords_matched).toContain('performance');
      expect(analysis.keywords_matched).toContain('optimization');
      expect(analysis.analyzed_intent).toBe('information_request');
    });

    it('should identify financial analysis keywords', async () => {
      const query = 'Calculate the ROI for this investment portfolio';
      const analysis = await service.analyzeQuery(query);

      expect(analysis.keywords_matched).toContain('roi');
      expect(analysis.keywords_matched).toContain('investment');
      expect(analysis.keywords_matched).toContain('portfolio');
      expect(analysis.domain_indicators).toContain('finance');
      expect(analysis.analyzed_intent).toBe('analysis_request');
    });

    it('should detect creative content requests', async () => {
      const query = 'Write a compelling blog post about AI technology';
      const analysis = await service.analyzeQuery(query);

      expect(analysis.keywords_matched).toContain('write');
      expect(analysis.keywords_matched).toContain('blog');
      expect(analysis.domain_indicators).toContain('content_creation');
      expect(analysis.analyzed_intent).toBe('task_request');
    });

    it('should handle data science queries', async () => {
      const query = 'Build a machine learning model to predict customer churn';
      const analysis = await service.analyzeQuery(query);

      expect(analysis.keywords_matched).toContain('machine learning');
      expect(analysis.keywords_matched).toContain('model');
      expect(analysis.keywords_matched).toContain('prediction');
      expect(analysis.domain_indicators).toContain('data_science');
      expect(analysis.analyzed_intent).toBe('task_request');
    });

    it('should consider conversation context', async () => {
      const query = 'What about the performance implications?';
      const conversationHistory = [
        'How do I optimize my SQL database?',
        'Should I add indexes to my tables?'
      ];
      
      const analysis = await service.analyzeQuery(query, conversationHistory);
      
      expect(analysis.context_influence).toBeGreaterThan(0);
      expect(analysis.analyzed_intent).toBe('information_request');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queries gracefully', async () => {
      const analysis = await service.analyzeQuery('');
      
      expect(analysis.keywords_matched).toEqual([]);
      expect(analysis.domain_indicators).toEqual([]);
      expect(analysis.analyzed_intent).toBe('general_inquiry');
    });

    it('should handle queries with no specialist matches', async () => {
      const query = 'Hello, how are you?';
      const analysis = await service.analyzeQuery(query);
      
      expect(analysis.keywords_matched.length).toBeLessThanOrEqual(1);
      expect(analysis.analyzed_intent).toBe('general_inquiry');
    });

    it('should handle very long queries', async () => {
      const longQuery = 'I need help with ' + 'a '.repeat(1000) + 'SQL performance optimization issue';
      const analysis = await service.analyzeQuery(longQuery);
      
      expect(analysis.keywords_matched).toContain('sql');
      expect(analysis.keywords_matched).toContain('performance');
      expect(analysis.keywords_matched).toContain('optimization');
    });
  });
});