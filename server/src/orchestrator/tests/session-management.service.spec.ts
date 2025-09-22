import { Test, TestingModule } from '@nestjs/testing';
import { SessionManagementService } from '../services/session-management.service';
import { QueryAnalysis } from '../types/orchestrator.types';

describe('SessionManagementService', () => {
  let service: SessionManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionManagementService],
    }).compile();

    service = module.get<SessionManagementService>(SessionManagementService);
  });

  describe('Session Management Tests', () => {
    it('should create new session context', async () => {
      const sessionId = 'test-session-1';
      const userQuery = 'Hello, I need help with SQL optimization';

      const context = await service.getOrCreateContext(sessionId, userQuery);

      expect(context.session_id).toBe(sessionId);
      expect(context.user_query).toBe(userQuery);
      expect(context.conversation_history).toEqual([]);
      expect(context.routing_decisions).toEqual([]);
      expect(context.message_count).toBe(0);
      expect(context.created_at).toBeInstanceOf(Date);
    });

    it('should update existing session context', async () => {
      const sessionId = 'test-session-2';
      
      // Create initial context
      const context1 = await service.getOrCreateContext(sessionId, 'First query');
      const initialTime = context1.created_at;
      
      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      const context2 = await service.getOrCreateContext(sessionId, 'Second query');

      expect(context2.session_id).toBe(sessionId);
      expect(context2.user_query).toBe('Second query');
      expect(context2.created_at).toEqual(initialTime); // Should preserve creation time
      expect(context2.last_activity.getTime()).toBeGreaterThan(initialTime.getTime());
    });

    it('should add conversation steps correctly', async () => {
      const sessionId = 'test-session-3';
      await service.getOrCreateContext(sessionId, 'Initial query');

      const mockAnalysis: QueryAnalysis = {
        analyzed_intent: 'technical_request',
        keywords_matched: ['code', 'programming'],
        domain_indicators: ['software_development'],
        confidence_scores: { 'technical-specialist': 0.95 },
        selected_agent: 'technical-specialist',
        reasoning: 'High technical keyword match',
        context_influence: 0.2
      };

      await service.addConversationStep(
        sessionId,
        'How do I optimize this code?',
        'technical-specialist',
        'Here are some optimization strategies...',
        mockAnalysis
      );

      const context = await service.getOrCreateContext(sessionId, 'Follow-up query');
      
      expect(context.conversation_history.length).toBe(1);
      expect(context.routing_decisions.length).toBe(1);
      expect(context.current_agent).toBe('technical-specialist');
      expect(context.message_count).toBe(1);
      
      const step = context.conversation_history[0];
      expect(step.user_message).toBe('How do I optimize this code?');
      expect(step.agent_id).toBe('technical-specialist');
      expect(step.agent_response).toBe('Here are some optimization strategies...');
    });

    it('should track session statistics correctly', async () => {
      const sessionId = 'test-session-4';
      await service.getOrCreateContext(sessionId, 'Initial query');

      // Add multiple conversation steps with different agents
      const analyses = [
        {
          analyzed_intent: 'technical_request',
          keywords_matched: ['code'],
          domain_indicators: ['software_development'],
          confidence_scores: { 'technical-specialist': 0.9 },
          selected_agent: 'technical-specialist',
          reasoning: 'Technical query',
          context_influence: 0
        },
        {
          analyzed_intent: 'business_request',
          keywords_matched: ['strategy'],
          domain_indicators: ['business_strategy'],
          confidence_scores: { 'business-analyst': 0.8 },
          selected_agent: 'business-analyst',
          reasoning: 'Business query',
          context_influence: 0
        },
        {
          analyzed_intent: 'technical_request',
          keywords_matched: ['database'],
          domain_indicators: ['software_development'],
          confidence_scores: { 'technical-specialist': 0.85 },
          selected_agent: 'technical-specialist',
          reasoning: 'Another technical query',
          context_influence: 0
        }
      ];

      for (let i = 0; i < analyses.length; i++) {
        await service.addConversationStep(
          sessionId,
          `Query ${i + 1}`,
          analyses[i].selected_agent,
          `Response ${i + 1}`,
          analyses[i]
        );
      }

      const stats = service.getSessionStats(sessionId);
      
      expect(stats).toBeDefined();
      expect(stats!.messageCount).toBe(3);
      expect(stats!.agentSwitches).toBe(1); // technical -> business -> technical = 1 switch
      expect(stats!.mostUsedAgent).toBe('technical-specialist');
      expect(stats!.sessionDuration).toBeGreaterThan(0);
    });

    it('should provide conversation context for routing', async () => {
      const sessionId = 'test-session-5';
      await service.getOrCreateContext(sessionId, 'Initial query');

      // Add conversation history
      for (let i = 1; i <= 7; i++) {
        const mockAnalysis: QueryAnalysis = {
          analyzed_intent: 'test_request',
          keywords_matched: [],
          domain_indicators: [],
          confidence_scores: {},
          selected_agent: 'test-agent',
          reasoning: 'test',
          context_influence: 0
        };

        await service.addConversationStep(
          sessionId,
          `User message ${i}`,
          'test-agent',
          `Agent response ${i}`,
          mockAnalysis
        );
      }

      const context = service.getConversationContext(sessionId);
      
      // Should return last 5 user messages
      expect(context.length).toBe(5);
      expect(context[0]).toBe('User message 3'); // Should start from message 3
      expect(context[4]).toBe('User message 7'); // Should end with message 7
    });

    it('should clear sessions successfully', async () => {
      const sessionId = 'test-session-6';
      await service.getOrCreateContext(sessionId, 'Test query');
      
      expect(service.getActiveSessions()).toContain(sessionId);
      
      const cleared = service.clearSession(sessionId);
      
      expect(cleared).toBe(true);
      expect(service.getActiveSessions()).not.toContain(sessionId);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent session stats gracefully', () => {
      const stats = service.getSessionStats('non-existent-session');
      expect(stats).toBeNull();
    });

    it('should handle clearing non-existent sessions', () => {
      const cleared = service.clearSession('non-existent-session');
      expect(cleared).toBe(false);
    });

    it('should track active session count accurately', async () => {
      const initialCount = service.getActiveSessionCount();
      
      await service.getOrCreateContext('session-a', 'Query A');
      await service.getOrCreateContext('session-b', 'Query B');
      
      expect(service.getActiveSessionCount()).toBe(initialCount + 2);
      
      service.clearSession('session-a');
      
      expect(service.getActiveSessionCount()).toBe(initialCount + 1);
    });
  });
});