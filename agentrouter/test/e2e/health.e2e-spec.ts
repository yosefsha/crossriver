import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Health Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root path (/)', () => {
    it('should return 200 and welcome message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Agent Router API');
        });
    });
  });

  describe('Status endpoint (/status)', () => {
    it('should return 200 and health info', () => {
      return request(app.getHttpServer())
        .get('/status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
          expect(res.body).toHaveProperty('service');
          expect(res.body.service).toBe('agentrouter');
        });
    });
  });

  describe('Health endpoint (/health)', () => {
    it('should return 200 and basic health info', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
        });
    });

    it('should return 200 and detailed health info', () => {
      return request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('aws');
        });
    });
  });
});