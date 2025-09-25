import { Test, TestingModule } from '@nestjs/testing';
import { OrchestratorService } from '../services/orchestrator.service';
import { QueryAnalysisService } from '../services/query-analysis.service';
import { ConfidenceScoringService } from '../services/confidence-scoring.service';
import { SessionManagementService } from '../services/session-management.service';
import { BedrockService } from '../services/bedrock.service';

describe('OrchestratorService Integration', () => {
  let orchestratorService: OrchestratorService;
  let bedrockService: BedrockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestratorService,
        QueryAnalysisService,
        ConfidenceScoringService,
        SessionManagementService,
        BedrockService,
      ],
    }).compile();

    orchestratorService = module.get<OrchestratorService>(OrchestratorService);
    bedrockService = module.get<BedrockService>(BedrockService);
  });

  describe('End-to-End Orchestration Tests', () => {
    it('should orchestrate technical queries correctly', async () => {
      const query = 'How do I optimize my SQL database performance?';
      const sessionId = 'integration-test-1';

      const result = await orchestratorService.orchestrateQuery(query, sessionId);

      expect(result).toBeDefined();
      expect(result.session_id).toBe(sessionId);
      expect(result.handling_agent).toBe('technical-specialist');
      expect(result.agent_name).toBe('Technical Specialist');
      expect(result.routing_analysis.analyzed_intent).toBeDefined();
      expect(result.routing_analysis.keywords_matched).toContain('sql');
      expect(result.routing_analysis.confidence_scores['technical-specialist']).toBeGreaterThan(0.7);
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(result.response).toContain('Technical Specialist');
    });

    it('should orchestrate financial queries correctly', async () => {
      const query = 'What is the ROI calculation for a $50k investment that returns $75k?';
      const sessionId = 'integration-test-2';

      const result = await orchestratorService.orchestrateQuery(query, sessionId);

      expect(result.handling_agent).toBe('financial-analyst');
      expect(result.agent_name).toBe('Financial Analyst');
      expect(result.routing_analysis.keywords_matched).toContain('roi');
      expect(result.routing_analysis.keywords_matched).toContain('investment');
      expect(result.response).toContain('Financial Analyst');
    });

    it('should orchestrate data science queries correctly', async () => {
      const query = 'Build a machine learning model to predict customer churn using Python';
      const sessionId = 'integration-test-3';

      const result = await orchestratorService.orchestrateQuery(query, sessionId);

      expect(result.handling_agent).toBe('data-scientist');
      expect(result.agent_name).toBe('Data Scientist');
      expect(result.routing_analysis.keywords_matched).toContain('machine learning');
      expect(result.routing_analysis.keywords_matched).toContain('model');
      expect(result.routing_analysis.keywords_matched).toContain('python');
    });

    it('should handle agent switching in conversations', async () => {
      const sessionId = 'integration-test-4';

      // First query: Technical
      const result1 = await orchestratorService.orchestrateQuery(
        'How do I create a REST API in Node.js?',
        sessionId
      );
      expect(result1.handling_agent).toBe('technical-specialist');

      // Second query: Business impact (should switch agents)
      const result2 = await orchestratorService.orchestrateQuery(
        'What is the business value of implementing this API?',
        sessionId
      );
      expect(result2.handling_agent).toBe('business-analyst');
      expect(result2.session_id).toBe(sessionId); // Same session
    });

    it('should maintain session context across queries', async () => {
      const sessionId = 'integration-test-5';

      // First query
      const result1 = await orchestratorService.orchestrateQuery(
        'I need help with database optimization',
        sessionId
      );

      // Second query with context reference
      const result2 = await orchestratorService.orchestrateQuery(
        'What about indexing strategies?',
        sessionId
      );

      expect(result1.session_id).toBe(result2.session_id);
      expect(result2.routing_analysis.context_influence).toBeGreaterThan(0);
    });

    it('should start new sessions correctly', async () => {
      const initialMessage = 'Create a marketing campaign for a tech startup';

      const result = await orchestratorService.startOrchestratedSession(initialMessage);

      expect(result.session_id).toMatch(/^orch_\d+_[a-z0-9]+$/);
      expect(result.handling_agent).toBe('creative-specialist');
      expect(result.agent_name).toBe('Creative Specialist');
      expect(result.routing_analysis.keywords_matched).toContain('marketing');
      expect(result.routing_analysis.keywords_matched).toContain('campaign');
    });
  });

  describe('System Integration Tests', () => {
    it('should provide accurate orchestrator status', () => {
      const status = orchestratorService.getOrchestratorStatus();

      expect(status.isActive).toBe(true);
      expect(status.availableAgents).toHaveLength(5); // All 5 specialists
      expect(status.availableAgents.map(a => a.id)).toContain('technical-specialist');
      expect(status.availableAgents.map(a => a.id)).toContain('financial-analyst');
      expect(status.availableAgents.map(a => a.id)).toContain('data-scientist');
      expect(status.availableAgents.map(a => a.id)).toContain('business-analyst');
      expect(status.availableAgents.map(a => a.id)).toContain('creative-specialist');
      expect(status.version).toBe('1.0.0');
    });

    it('should handle session clearing', async () => {
      const sessionId = 'integration-test-6';
      
      // Create a session
      await orchestratorService.orchestrateQuery('Test query', sessionId);
      
      // Verify session exists by checking stats
      const statsBefore = orchestratorService.getSessionStats(sessionId);
      expect(statsBefore).toBeDefined();
      
      // Clear the session
      const cleared = orchestratorService.clearSession(sessionId);
      expect(cleared).toBe(true);
      
      // Verify session is gone
      const statsAfter = orchestratorService.getSessionStats(sessionId);
      expect(statsAfter).toBeNull();
    });

    it('should generate valid runtime system prompts', async () => {
      // Spy on BedrockService to capture system prompts
      const invokeAgentSpy = jest.spyOn(bedrockService, 'invokeAgent');
      
      await orchestratorService.orchestrateQuery(
        'Help me debug this JavaScript function',
        'prompt-test-session'
      );

      expect(invokeAgentSpy).toHaveBeenCalled();
      
      const [agentId, aliasId, query, sessionId, systemPrompt] = invokeAgentSpy.mock.calls[0];
      
      expect(systemPrompt).toContain('Technical Specialist');
      expect(systemPrompt).toContain('SPECIALIST CAPABILITIES');
      expect(systemPrompt).toContain('BEHAVIORAL INSTRUCTIONS');
      expect(systemPrompt).toContain('CURRENT CONTEXT');
      expect(systemPrompt).toContain('software_development');
    });
  });

  describe('Performance Tests', () => {
    it('should process queries within reasonable time limits', async () => {
      const startTime = Date.now();
      
      const result = await orchestratorService.orchestrateQuery(
        'Analyze this data with machine learning',
        'performance-test-1'
      );
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.processing_time_ms).toBeLessThan(totalTime);
    });

    it('should handle multiple concurrent sessions', async () => {
      const queries = [
        { query: 'Optimize SQL performance', expectedAgent: 'technical-specialist' },
        { query: 'Calculate investment ROI', expectedAgent: 'financial-analyst' },
        { query: 'Create marketing content', expectedAgent: 'creative-specialist' },
        { query: 'Build ML model', expectedAgent: 'data-scientist' },
        { query: 'Develop business strategy', expectedAgent: 'business-analyst' }
      ];

      const promises = queries.map((item, index) =>
        orchestratorService.orchestrateQuery(item.query, `concurrent-test-${index}`)
      );

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.handling_agent).toBe(queries[index].expectedAgent);
        expect(result.session_id).toBe(`concurrent-test-${index}`);
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle empty queries gracefully', async () => {
      await expect(
        orchestratorService.orchestrateQuery('', 'error-test-1')
      ).rejects.toThrow();
    });

    it('should handle very long queries', async () => {
      const longQuery = 'I need help with ' + 'a '.repeat(1000) + 'technical issue';
      
      const result = await orchestratorService.orchestrateQuery(longQuery, 'long-query-test');
      
      expect(result).toBeDefined();
      expect(result.handling_agent).toBeDefined();
    });

    it('should fallback gracefully for ambiguous queries', async () => {
      const result = await orchestratorService.orchestrateQuery(
        'Hello, how are you?',
        'ambiguous-test'
      );

      // Should either route to a specialist with low confidence or fallback
      expect(result).toBeDefined();
      expect(result.handling_agent).toBeDefined();
      expect(result.response).toBeDefined();
    });
  });
});