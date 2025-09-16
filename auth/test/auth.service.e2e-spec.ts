import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import 'jest';

import { AppModule } from '../src/app.module';
import { AuthService } from '../src/services/auth.service';
import { generateRandomString, dynamoTestHelper } from './helpers';

describe('Auth Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Wait for DynamoDB table to be ready
    await dynamoTestHelper.waitForTable();
  });

  beforeEach(async () => {
    // Clear database before each test
    await dynamoTestHelper.clearTable();
  });

  afterAll(async () => {
    // Clean up after all tests
    await dynamoTestHelper.clearTable();
    await app.close();
  });

  describe('POST /login', () => {
    it('should return 400 if no body is sent', () => {
      return request(app.getHttpServer())
        .post('/login')
        .expect(400);
    });

    it('should return 400 if email is missing', () => {
      return request(app.getHttpServer())
        .post('/login')
        .send({ password: 'testpassword' })
        .expect(400);
    });

    it('should return 200 if valid email and password are provided', async () => {
      // First register a user
      const testEmail = `testuser_${generateRandomString(4)}@abc.com`;
      const testPassword = 'testpassword';
      const testUsername = 'Test User';

      await request(app.getHttpServer())
        .post('/register')
        .send({ email: testEmail, password: testPassword, username: testUsername })
        .expect(201);

      // Then login with the same credentials
      return request(app.getHttpServer())
        .post('/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testEmail);
          expect(res.body.user.username).toBe(testUsername);
        });
    });

    it('should return 401 if password is missing', () => {
      return request(app.getHttpServer())
        .post('/login')
        .send({ email: 'testuser@abc.com' })
        .expect(400);
    });

    it('should return 401 if password is incorrect', async () => {
      // First register a user
      const testEmail = `testuser_${generateRandomString(4)}@abc.com`;
      const testPassword = 'testpassword';
      const testUsername = 'Test User';

      await request(app.getHttpServer())
        .post('/register')
        .send({ email: testEmail, password: testPassword, username: testUsername })
        .expect(201);

      // Then try to login with wrong password
      return request(app.getHttpServer())
        .post('/login')
        .send({ email: testEmail, password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 if user does not exist', () => {
      return request(app.getHttpServer())
        .post('/login')
        .send({ email: 'nonexistent@abc.com', password: 'testpassword' })
        .expect(401);
    });
  });

  describe('POST /register', () => {
    it('should return 400 if no body is sent', () => {
      return request(app.getHttpServer())
        .post('/register')
        .expect(400);
    });

    it('should return 400 if email is missing', () => {
      return request(app.getHttpServer())
        .post('/register')
        .send({ password: 'testpassword', username: 'Test User' })
        .expect(400);
    });

    it('should return 400 if password is missing', () => {
      return request(app.getHttpServer())
        .post('/register')
        .send({ email: 'testuser@abc.com', username: 'Test User' })
        .expect(400);
    });

    it('should return 400 if username is missing', () => {
      return request(app.getHttpServer())
        .post('/register')
        .send({ email: 'testuser@abc.com', password: 'testpassword' })
        .expect(400);
    });

    it('should return 201 if all required fields are provided', () => {
      const testEmail = `testuser_${generateRandomString(4)}@abc.com`;
      return request(app.getHttpServer())
        .post('/register')
        .send({ email: testEmail, password: 'testpassword', username: 'Test User' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testEmail);
          expect(res.body.user.username).toBe('Test User');
          expect(res.body.user.roles).toContain('user');
        });
    });

    it('should return 409 if user already exists', async () => {
      const testEmail = `testuser_${generateRandomString(4)}@abc.com`;
      const userData = { email: testEmail, password: 'testpassword', username: 'Test User' };

      // Register user first time
      await request(app.getHttpServer())
        .post('/register')
        .send(userData)
        .expect(201);

      // Try to register same user again
      return request(app.getHttpServer())
        .post('/register')
        .send(userData)
        .expect(409);
    });
  });

  describe('JWT Token Verification', () => {
    let authService: AuthService;

    beforeEach(async () => {
      authService = app.get(AuthService);
    });

    it('should verify a valid JWT token', async () => {
      const testEmail = 'verify1@example.com';
      const testPassword = 'password123';
      
      // Create test user
      await request(app.getHttpServer())
        .post('/register')
        .send({
          email: testEmail,
          password: testPassword,
          username: 'verifyuser1',
        })
        .expect(201);

      // Login to get a token
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      const token = loginResponse.body.access_token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token using the service
      const payload = await authService.verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.email).toBe(testEmail);
      expect(payload.iss).toBe('myassistant-auth');
      expect(payload.aud).toEqual(['myassistant-server', 'myassistant-client']);
      expect(payload.roles).toEqual(['user']);
      expect(payload.scopes).toEqual(['read:own', 'write:own']);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      await expect(authService.verifyToken(invalidToken))
        .rejects
        .toThrow('Invalid or expired token');
    });

    it('should throw UnauthorizedException for malformed token', async () => {
      const malformedToken = 'not-a-jwt-token';
      
      await expect(authService.verifyToken(malformedToken))
        .rejects
        .toThrow('Invalid or expired token');
    });
  });
});
