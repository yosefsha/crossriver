import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('App Controller (e2e)', () => {
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

  describe('GET /', () => {
    it('should return "Hello World!"', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World! NestJS API is running.');
    });

    it('should return text/html content type', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Content-Type', /text\/html/);
    });
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
  });

  describe('GET /bar', () => {
    it('should return 200 status code', () => {
      return request(app.getHttpServer())
        .get('/bar')
        .expect(200);
    });

    it('should return correct response structure', () => {
      return request(app.getHttpServer())
        .get('/bar')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Hello from bar endpoint!');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id', 2);
          expect(res.body.data).toHaveProperty('name', 'Bar Item');
          expect(res.body.data).toHaveProperty('description', 'This is a simple bar endpoint response');
          expect(res.body.data).toHaveProperty('timestamp');
        });
    });

    it('should return correct data types', () => {
      return request(app.getHttpServer())
        .get('/bar')
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
        .get('/bar')
        .expect(200)
        .then((response) => {
          const timestamp = response.body.data.timestamp;
          
          expect(() => new Date(timestamp)).not.toThrow();
          expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });
  });

  describe('Comparison Tests', () => {
    it('should return different data between foo and bar endpoints', async () => {
      const fooResponse = await request(app.getHttpServer()).get('/foo');
      const barResponse = await request(app.getHttpServer()).get('/bar');
      
      // Different IDs
      expect(fooResponse.body.data.id).toBe(1);
      expect(barResponse.body.data.id).toBe(2);
      
      // Different names
      expect(fooResponse.body.data.name).toBe('Foo Item');
      expect(barResponse.body.data.name).toBe('Bar Item');
      
      // Different messages
      expect(fooResponse.body.message).toBe('Hello from foo endpoint!');
      expect(barResponse.body.message).toBe('Hello from bar endpoint!');
    });

    it('should have the same response structure for both endpoints', async () => {
      const fooResponse = await request(app.getHttpServer()).get('/foo');
      const barResponse = await request(app.getHttpServer()).get('/bar');
      
      // Same top-level structure
      expect(Object.keys(fooResponse.body)).toEqual(Object.keys(barResponse.body));
      expect(Object.keys(fooResponse.body.data)).toEqual(Object.keys(barResponse.body.data));
    });
  });
});