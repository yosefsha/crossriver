import { Test, TestingModule } from '@nestjs/testing';
import { QueryAnalysisService } from '../services/query-analysis.service';
import { ConfidenceScoringService } from '../services/confidence-scoring.service';
import { SessionManagementService } from '../services/session-management.service';

describe('Orchestrator Performance Tests', () => {
  let queryAnalysisService: QueryAnalysisService;
  let confidenceScoringService: ConfidenceScoringService;
  let sessionManagementService: SessionManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryAnalysisService,
        ConfidenceScoringService,
        SessionManagementService,
      ],
    }).compile();

    queryAnalysisService = module.get<QueryAnalysisService>(QueryAnalysisService);
    confidenceScoringService = module.get<ConfidenceScoringService>(ConfidenceScoringService);
    sessionManagementService = module.get<SessionManagementService>(SessionManagementService);
  });

  describe('Query Analysis Performance', () => {
    it('should process query analysis in under 100ms', async () => {
      const startTime = performance.now();
      
      await queryAnalysisService.analyzeQuery(
        'How do I optimize SQL database performance for complex queries with joins?'
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });

    it('should handle batch query analysis efficiently', async () => {
      const queries = [
        'Help me debug my React application',
        'What is the best investment strategy for retirement?',
        'Create a social media marketing campaign',
        'Build a machine learning model for fraud detection',
        'Analyze quarterly financial performance',
      ];

      const startTime = performance.now();
      
      const analyses = await Promise.all(
        queries.map(query => queryAnalysisService.analyzeQuery(query))
      );
      
      const endTime = performance.now();
      const avgDuration = (endTime - startTime) / queries.length;
      
      expect(analyses).toHaveLength(5);
      expect(avgDuration).toBeLessThan(50);
    });
  });

  describe('Confidence Scoring Performance', () => {
    it('should calculate routing decisions quickly', async () => {
      const analysis = await queryAnalysisService.analyzeQuery(
        'Optimize my React application performance'
      );

      const startTime = performance.now();
      
      const decision = await confidenceScoringService.calculateRoutingDecision(analysis);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50);
      expect(decision.selected_agent).toBeDefined();
    });

    it('should maintain performance with long conversation context', async () => {
      const longContext = Array(50).fill(null).map((_, i) => 
        `This is message ${i + 1} about technical development`
      );

      const analysis = await queryAnalysisService.analyzeQuery(
        'Help me with more React optimization'
      );

      const startTime = performance.now();
      
      const decision = await confidenceScoringService.calculateRoutingDecision(
        analysis,
        longContext
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
      expect(decision.selected_agent).toBeDefined();
    });
  });

  describe('Session Management Performance', () => {
    it('should handle concurrent session creation', async () => {
      const concurrentSessions = 20;
      const sessionPromises = [];

      const startTime = performance.now();
      
      for (let i = 0; i < concurrentSessions; i++) {
        sessionPromises.push(
          sessionManagementService.getOrCreateContext(`test-session-${i}`, `Test query ${i}`)
        );
      }
      
      const sessions = await Promise.all(sessionPromises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(sessions).toHaveLength(concurrentSessions);
      expect(duration).toBeLessThan(500);
      
      // Cleanup
      await Promise.all(
        sessions.map(session => sessionManagementService.clearSession(session.session_id))
      );
    });

    it('should efficiently manage memory with many conversation steps', async () => {
      const context = await sessionManagementService.getOrCreateContext('memory-test', 'Initial query');
      
      const stepCount = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < stepCount; i++) {
        await sessionManagementService.addConversationStep(
          context.session_id,
          `Test message ${i + 1}`,
          'technical-specialist',
          `Response ${i + 1}`,
          {
            analyzed_intent: 'technical_question',
            keywords_matched: ['test'],
            domain_indicators: ['software_development'],
            confidence_scores: { 'technical-specialist': 0.9 },
            selected_agent: 'technical-specialist',
            reasoning: 'Test reasoning',
            context_influence: 0.1
          }
        );
      }
      
      const endTime = performance.now();
      const avgTimePerStep = (endTime - startTime) / stepCount;
      
      expect(avgTimePerStep).toBeLessThan(5);
      
      const stats = sessionManagementService.getSessionStats(context.session_id);
      expect(stats.messageCount).toBe(stepCount);
      
      // Cleanup
      await sessionManagementService.clearSession(context.session_id);
    });
  });

  describe('End-to-End Performance', () => {
    it('should complete full orchestration cycle quickly', async () => {
      const message = 'Help me optimize my SQL database performance';
      
      const startTime = performance.now();
      
      const analysis = await queryAnalysisService.analyzeQuery(message);
      const decision = await confidenceScoringService.calculateRoutingDecision(analysis);
      const selectedAgent = decision.selected_agent;
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
      expect(selectedAgent).toBe('technical-specialist');
    });

    it('should handle burst of concurrent requests', async () => {
      const concurrentRequests = 10;
      const requests = [];

      const messages = [
        'Help with React development',
        'Analyze financial data',
        'Create marketing content',
        'Build ML model',
        'Technical architecture advice',
        'Investment portfolio analysis',
        'Write blog post',
        'Data visualization help',
        'Business strategy planning',
        'Code review assistance'
      ];

      const startTime = performance.now();
      
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push((async () => {
          const analysis = await queryAnalysisService.analyzeQuery(messages[i]);
          const decision = await confidenceScoringService.calculateRoutingDecision(analysis);
          return decision.selected_agent;
        })());
      }
      
      const results = await Promise.all(requests);
      
      const endTime = performance.now();
      const avgDuration = (endTime - startTime) / concurrentRequests;
      
      expect(results).toHaveLength(concurrentRequests);
      expect(avgDuration).toBeLessThan(100);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle session cleanup efficiently', async () => {
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        const context = await sessionManagementService.getOrCreateContext(
          `test-cleanup-${i}`, 
          `Test query ${i}`
        );
        sessions.push(context.session_id);
      }

      for (const sessionId of sessions) {
        for (let j = 0; j < 5; j++) {
          await sessionManagementService.addConversationStep(
            sessionId,
            `Message ${j}`,
            'technical-specialist',
            `Response ${j}`,
            {
              analyzed_intent: 'technical_question',
              keywords_matched: ['test'],
              domain_indicators: ['software_development'],
              confidence_scores: { 'technical-specialist': 0.9 },
              selected_agent: 'technical-specialist',
              reasoning: 'Test reasoning',
              context_influence: 0.1
            }
          );
        }
      }

      const startTime = performance.now();
      
      for (const sessionId of sessions) {
        await sessionManagementService.clearSession(sessionId);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000);
      
      for (const sessionId of sessions) {
        const stats = sessionManagementService.getSessionStats(sessionId);
        expect(stats).toBeNull();
      }
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover quickly from invalid queries', async () => {
      const invalidQueries = [
        '',
        '   ',
        'a'.repeat(10000),
        '🎉🎊🎈',
        'null' as any,
      ];

      const startTime = performance.now();
      
      const results = await Promise.allSettled(
        invalidQueries.map(query => queryAnalysisService.analyzeQuery(query))
      );
      
      const endTime = performance.now();
      const avgDuration = (endTime - startTime) / invalidQueries.length;
      
      expect(avgDuration).toBeLessThan(50);
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
        }
      });
    });
  });
});