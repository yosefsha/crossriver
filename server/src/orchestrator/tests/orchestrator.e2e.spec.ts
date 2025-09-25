import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { OrchestratorModule } from '../orchestrator.module';

describe('OrchestratorController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrchestratorModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/orchestrator/session/start (POST)', () => {
    it('should start a new orchestrated session', () => {
      return request(app.getHttpServer())
        .post('/orchestrator/session/start')
        .send({
          message: 'How do I optimize my SQL database performance?'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.session_id).toMatch(/^orch_\d+_[a-z0-9]+$/);
          expect(res.body.handling_agent).toBe('technical-specialist');
          expect(res.body.agent_name).toBe('Technical Specialist');
          expect(res.body.response).toContain('Technical Specialist');
          expect(res.body.routing_analysis).toBeDefined();
          expect(res.body.routing_analysis.keywords_matched).toContain('sql');
          expect(res.body.processing_time_ms).toBeGreaterThan(0);
        });
    });

    it('should reject empty messages', () => {
      return request(app.getHttpServer())
        .post('/orchestrator/session/start')
        .send({
          message: ''
        })
        .expect(400);
    });

    it('should reject requests without message', () => {
      return request(app.getHttpServer())
        .post('/orchestrator/session/start')
        .send({})
        .expect(400);
    });
  });

  describe('/orchestrator/query (POST)', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a session first
      const response = await request(app.getHttpServer())
        .post('/orchestrator/session/start')
        .send({
          message: 'Initial technical question about databases'
        })
        .expect(201);
      
      sessionId = response.body.session_id;
    });

    it('should process queries in existing session', () => {
      return request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: 'What about indexing strategies?',
          sessionId: sessionId
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.session_id).toBe(sessionId);
          expect(res.body.handling_agent).toBeDefined();
          expect(res.body.response).toBeDefined();
          expect(res.body.routing_analysis.context_influence).toBeGreaterThanOrEqual(0);
        });
    });

    it('should handle agent switching within session', async () => {
      // First: technical query
      const techResponse = await request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: 'How do I debug this SQL query?',
          sessionId: sessionId
        })
        .expect(200);

      expect(techResponse.body.handling_agent).toBe('technical-specialist');

      // Second: business query (should switch agents)
      const businessResponse = await request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: 'What is the business impact of optimizing this database?',
          sessionId: sessionId
        })
        .expect(200);

      expect(businessResponse.body.handling_agent).toBe('business-analyst');
      expect(businessResponse.body.session_id).toBe(sessionId);
    });

    it('should reject empty messages', () => {
      return request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: '',
          sessionId: sessionId
        })
        .expect(400);
    });

    it('should reject missing session ID', () => {
      return request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: 'Valid message'
        })
        .expect(400);
    });
  });

  describe('/orchestrator/status (GET)', () => {
    it('should return orchestrator status', () => {
      return request(app.getHttpServer())
        .get('/orchestrator/status')
        .expect(200)
        .expect((res) => {
          expect(res.body.is_active).toBe(true);
          expect(res.body.available_agents).toHaveLength(5);
          expect(res.body.active_sessions).toBeGreaterThanOrEqual(0);
          expect(res.body.uptime_seconds).toBeGreaterThan(0);
          expect(res.body.version).toBe('1.0.0');
          
          // Verify agent structure
          const agents = res.body.available_agents;
          const agentIds = agents.map((a: any) => a.agent_id);
          expect(agentIds).toContain('technical-specialist');
          expect(agentIds).toContain('financial-analyst');
          expect(agentIds).toContain('data-scientist');
          expect(agentIds).toContain('business-analyst');
          expect(agentIds).toContain('creative-specialist');
        });
    });
  });

  describe('/orchestrator/agents (GET)', () => {
    it('should return available agents', () => {
      return request(app.getHttpServer())
        .get('/orchestrator/agents')
        .expect(200)
        .expect((res) => {
          expect(res.body.agents).toHaveLength(5);
          expect(res.body.total_count).toBe(5);
          expect(res.body.active_sessions).toBeGreaterThanOrEqual(0);
          
          // Verify agent details
          const agents = res.body.agents;
          const technicalAgent = agents.find((a: any) => a.id === 'technical-specialist');
          expect(technicalAgent).toBeDefined();
          expect(technicalAgent.name).toBe('Technical Specialist');
          expect(technicalAgent.domains).toContain('software_development');
        });
    });
  });

  describe('/orchestrator/session/:sessionId/stats (GET)', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create session and add some conversation
      const startResponse = await request(app.getHttpServer())
        .post('/orchestrator/session/start')
        .send({
          message: 'Help me with technical problem'
        });
      
      sessionId = startResponse.body.session_id;

      // Add another message to create stats
      await request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: 'What about performance optimization?',
          sessionId: sessionId
        });
    });

    it('should return session statistics', () => {
      return request(app.getHttpServer())
        .get(`/orchestrator/session/${sessionId}/stats`)
        .expect(200)
        .expect((res) => {
          expect(res.body.session_id).toBe(sessionId);
          expect(res.body.messageCount).toBeGreaterThan(0);
          expect(res.body.agentSwitches).toBeGreaterThanOrEqual(0);
          expect(res.body.sessionDuration).toBeGreaterThan(0);
          expect(res.body.mostUsedAgent).toBeDefined();
          expect(res.body.lastActivity).toBeDefined();
        });
    });

    it('should return 404 for non-existent session', () => {
      return request(app.getHttpServer())
        .get('/orchestrator/session/non-existent-session/stats')
        .expect(404);
    });
  });

  describe('/orchestrator/session/:sessionId (DELETE)', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/orchestrator/session/start')
        .send({
          message: 'Test session to be deleted'
        });
      
      sessionId = response.body.session_id;
    });

    it('should clear session successfully', () => {
      return request(app.getHttpServer())
        .delete(`/orchestrator/session/${sessionId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain(sessionId);
        });
    });

    it('should verify session is actually cleared', async () => {
      // Clear the session
      await request(app.getHttpServer())
        .delete(`/orchestrator/session/${sessionId}`)
        .expect(200);

      // Try to get stats - should return 404
      await request(app.getHttpServer())
        .get(`/orchestrator/session/${sessionId}/stats`)
        .expect(404);
    });

    it('should return 404 when clearing non-existent session', () => {
      return request(app.getHttpServer())
        .delete('/orchestrator/session/non-existent-session')
        .expect(404);
    });
  });

  describe('/orchestrator/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/orchestrator/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('healthy');
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.uptime).toBeGreaterThanOrEqual(0);
          expect(res.body.service).toBe('orchestrator');
        });
    });
  });

  describe('Multi-Agent Conversation Flows (e2e)', () => {
    it('should demonstrate complete technical specialist flow', async () => {
      // Start with technical question
      const startResponse = await request(app.getHttpServer())
        .post('/orchestrator/session/start')
        .send({
          message: 'How do I optimize a slow SQL query?'
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;
      expect(startResponse.body.handling_agent).toBe('technical-specialist');

      // Follow up with more technical questions
      const followUp1 = await request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: 'What about database indexing?',
          sessionId: sessionId
        })
        .expect(200);

      expect(followUp1.body.handling_agent).toBe('technical-specialist');
      expect(followUp1.body.routing_analysis.context_influence).toBeGreaterThan(0);
    });

    it('should demonstrate cross-domain conversation with agent switching', async () => {
      // Start with data science question
      const startResponse = await request(app.getHttpServer())
        .post('/orchestrator/session/start')
        .send({
          message: 'Build a machine learning model to predict sales'
        })
        .expect(201);

      const sessionId = startResponse.body.session_id;
      expect(startResponse.body.handling_agent).toBe('data-scientist');

      // Switch to business question
      const businessResponse = await request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: 'What is the ROI of implementing this ML model?',
          sessionId: sessionId
        })
        .expect(200);

      expect(businessResponse.body.handling_agent).toBe('financial-analyst');

      // Switch to creative question
      const creativeResponse = await request(app.getHttpServer())
        .post('/orchestrator/query')
        .send({
          message: 'Write a blog post about this ML implementation',
          sessionId: sessionId
        })
        .expect(200);

      expect(creativeResponse.body.handling_agent).toBe('creative-specialist');

      // Verify session statistics show multiple agent switches
      const statsResponse = await request(app.getHttpServer())
        .get(`/orchestrator/session/${sessionId}/stats`)
        .expect(200);

      expect(statsResponse.body.agentSwitches).toBeGreaterThan(0);
    });
  });
});