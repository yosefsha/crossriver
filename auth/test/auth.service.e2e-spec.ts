import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import 'jest';

import { AppModule } from '../src/app.module';
import { generateRandomString } from './helpers';
import { use } from 'passport';

describe('Auth Service (e2e)', () => {
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

  describe('POST /login', () => {
    it('should return 400 if no body is sent', () => {
      return request(app.getHttpServer())
        .post('/login')
        .expect(400);
    });

    it('should return 401 if username is missing', () => {
      return request(app.getHttpServer())
        .post('/login')
        .send({ password: 'testpassword' })
        .expect(400);
    });

    it('should return 200 if username and password are provided', () => {
      return request(app.getHttpServer())
        .post('/login')
        .send({ email: 'testuser@abc.com', password: 'testpassword' })
        .expect(200);
    });

    it('should return 401 if password is missing', () => {
      return request(app.getHttpServer())
        .post('/login')
        .send({ username: 'testuser' })
        .expect(400);
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
        .send({ password: 'testpassword', name: 'Test User' })
        .expect(400);
    });

    it('should return 400 if password is missing', () => {
      return request(app.getHttpServer())
        .post('/register')
        .send({ email: 'testuser@abc.com' })
        .expect(400);
    });
    it('should return 201 if all required fields are provided', () => {
      return request(app.getHttpServer())
        .post('/register')
        .send({ email: `testuser_${generateRandomString(4)}@abc.com`, password: 'testpassword', username: 'Test User' })
        .expect(201);
    });
  });
});
