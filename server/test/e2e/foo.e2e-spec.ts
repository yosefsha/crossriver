import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import 'jest';

describe('Foo API (e2e)', () => {
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

  describe('GET /foo', () => {
    it('should return 200 status code', () => {
      return request(app.getHttpServer())
        .get('/foo')
        .expect(200);
    });

    it('should return correct response structure', () => {
      return request(app.getHttpServer())
        .get('/foo')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Hello from foo endpoint!');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id', 1);
          expect(res.body.data).toHaveProperty('name', 'Foo Item');
          expect(res.body.data).toHaveProperty('description', 'This is a simple foo endpoint response');
          expect(res.body.data).toHaveProperty('timestamp');
        });
    });

    it('should return correct data types', () => {
      return request(app.getHttpServer())
        .get('/foo')
        .expect(200)
        .then((response) => {
          const { body } = response;
          
          expect(typeof body.message).toBe('string');
          expect(typeof body.data.id).toBe('number');
          expect(typeof body.data.name).toBe('string');
          expect(typeof body.data.description).toBe('string');
          expect(typeof body.data.timestamp).toBe('string');
        });
    });

    it('should return valid ISO timestamp', () => {
      return request(app.getHttpServer())
        .get('/foo')
        .expect(200)
        .then((response) => {
          const timestamp = response.body.data.timestamp;
          
          // Validate that timestamp is a valid ISO date string
          expect(() => new Date(timestamp)).not.toThrow();
          expect(new Date(timestamp).toISOString()).toBe(timestamp);
          
          // Ensure timestamp is recent (within last 5 seconds)
          const now = new Date();
          const timestampDate = new Date(timestamp);
          const timeDiff = now.getTime() - timestampDate.getTime();
          expect(timeDiff).toBeLessThan(5000); // 5 seconds
        });
    });

    it('should return fresh timestamp on each request', async () => {
      const response1 = await request(app.getHttpServer()).get('/foo');
      
      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const response2 = await request(app.getHttpServer()).get('/foo');
      
      expect(response1.body.data.timestamp).not.toBe(response2.body.data.timestamp);
    });

    it('should have exact response structure', () => {
      return request(app.getHttpServer())
        .get('/foo')
        .expect(200)
        .then((response) => {
          const { body } = response;
          
          // Check that response has exact structure
          expect(Object.keys(body)).toEqual(['message', 'data']);
          expect(Object.keys(body.data).sort()).toEqual(['id', 'name', 'description', 'timestamp'].sort());
        });
    });

    it('should return consistent static data', () => {
      return request(app.getHttpServer())
        .get('/foo')
        .expect(200)
        .then((response) => {
          const { data } = response.body;
          
          // These values should always be the same
          expect(data.id).toBe(1);
          expect(data.name).toBe('Foo Item');
          expect(data.description).toBe('This is a simple foo endpoint response');
        });
    });
  });
});