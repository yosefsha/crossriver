import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('JWT Integration (e2e)', () => {
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

  describe('GET /users/public', () => {
    it('should be accessible without authentication', () => {
      return request(app.getHttpServer())
        .get('/users/public')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'This is a public endpoint');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('JWKS Integration via Traefik', () => {
    it('should access JWKS endpoint through Traefik routing', async () => {
      const traefiktUrl = process.env.TRAEFIK_URL || 'http://localhost';
      
      try {
        // Access JWKS endpoint via Traefik routing
        const jwksResponse = await request(traefiktUrl)
          .get('/auth/.well-known/jwks.json')  // Traefik routes /auth/* to auth service
          .expect(200);

        // Verify JWKS structure
        expect(jwksResponse.body).toHaveProperty('keys');
        expect(Array.isArray(jwksResponse.body.keys)).toBe(true);
        expect(jwksResponse.body.keys.length).toBeGreaterThan(0);
        
        const key = jwksResponse.body.keys[0];
        expect(key).toHaveProperty('kty', 'RSA');
        expect(key).toHaveProperty('use', 'sig');
        expect(key).toHaveProperty('alg', 'RS256');
        expect(key).toHaveProperty('n');
        expect(key).toHaveProperty('e');

      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Skipping integration test: Traefik not running on localhost:80');
          return;
        }
        throw error;
      }
    });
  });

  describe('Protected Endpoints via Traefik', () => {
    it('should return 401 without JWT token', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });

    it('should return 401 with invalid JWT token', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return user data with valid JWT token from auth service via Traefik', async () => {
      // Use Traefik routing - auth service is accessible via /auth prefix
      const traefiktUrl = process.env.TRAEFIK_URL || 'http://localhost';
      
      // Create a unique test user email to avoid conflicts
      const testEmail = `integration-test-${Date.now()}@example.com`;
      
      try {
        // Register a test user via Traefik routing
        await request(traefiktUrl)
          .post('/auth/register')  // Traefik routes /auth/* to auth service
          .send({
            email: testEmail,
            password: 'testpassword123',
            username: `user-${Date.now()}`,
            roles: ['user']
          })
          .expect(201);

        // Login to get JWT token via Traefik routing
        const loginResponse = await request(traefiktUrl)
          .post('/auth/login')  // Traefik routes /auth/* to auth service
          .send({
            email: testEmail,
            password: 'testpassword123'
          })
          .expect(200);

        const { access_token } = loginResponse.body;
        expect(access_token).toBeDefined();
        expect(typeof access_token).toBe('string');

        // Use the JWT token to access protected endpoint via Traefik routing
        const profileResponse = await request(traefiktUrl)
          .get('/api/users/profile')  // Traefik routes /api/* to server service
          .set('Authorization', `Bearer ${access_token}`)
          .expect(200);

        // Verify the response structure
        expect(profileResponse.body).toHaveProperty('message', 'This is a protected endpoint');
        expect(profileResponse.body).toHaveProperty('user');
        expect(profileResponse.body.user).toHaveProperty('userId');
        expect(profileResponse.body.user).toHaveProperty('email', testEmail);
        expect(profileResponse.body.user).toHaveProperty('roles');
        expect(profileResponse.body.user.roles).toContain('user');
        expect(profileResponse.body.user).toHaveProperty('scopes');
        expect(profileResponse.body.user.scopes).toEqual(['read:own', 'write:own']);

      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Skipping integration test: Traefik not running on localhost:80');
          return;
        }
        throw error;
      }
    });

    it.only('should work with admin role and full scopes via Traefik', async () => {
      const traefiktUrl = process.env.TRAEFIK_URL || 'http://localhost';
      const adminEmail = `admin-test-${Date.now()}@example.com`;
      
      try {
        // Register an admin user via Traefik routing
        await request(traefiktUrl)
          .post('/auth/register')  // Traefik routes /auth/* to auth service
          .send({
            email: adminEmail,
            password: 'adminpassword123',
            username: `admin-${Date.now()}`,
            roles: ['admin']
          })
          .expect(201);

        // Login to get JWT token via Traefik routing
        const loginResponse = await request(traefiktUrl)
          .post('/auth/login')  // Traefik routes /auth/* to auth service
          .send({
            email: adminEmail,
            password: 'adminpassword123'
          })
          .expect(200);

        const { access_token } = loginResponse.body;

        // Verify admin has different scopes via Traefik routing
        const profileResponse = await request(traefiktUrl)
          .get('/api/users/profile')  // Traefik routes /api/* to server service
          .set('Authorization', `Bearer ${access_token}`)
          .expect(200);

        expect(profileResponse.body.user.roles).toContain('admin');
        expect(profileResponse.body.user.scopes).toEqual(
          expect.arrayContaining(['read:all', 'write:all', 'delete:all'])
        );

      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('Skipping integration test: Traefik not running on localhost:80');
          return;
        }
        throw error;
      }
    });
  });
});
