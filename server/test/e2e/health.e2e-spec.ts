import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Health API (e2e)', () => {
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

  describe('GET /health', () => {
    it('should return 200 status code', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });

    it('should return correct health check structure', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('environment');
        });
    });

    it('should return valid environment', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .then((response) => {
          const { environment } = response.body;
          expect(['development', 'test', 'production']).toContain(environment);
        });
    });

    it('should return valid timestamp', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .then((response) => {
          const timestamp = response.body.timestamp;
          
          expect(() => new Date(timestamp)).not.toThrow();
          expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });
  });
});