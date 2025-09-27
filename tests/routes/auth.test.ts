import request from 'supertest';
import express from 'express';
import { authRouter } from '../../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth Routes', () => {
  const validCredentials = {
    email: 'test@example.com',
    password: 'password123'
  };

  const invalidCredentials = {
    email: 'wrong@example.com',
    password: 'wrongpassword'
  };

  describe('should return JWT token when valid credentials provided', () => {
    it('should return JWT token when valid credentials provided', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send(validCredentials)
        .expect(200);

      expect(response.body).toMatchObject({
        token: expect.stringMatching(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/),
        user: expect.objectContaining({
          email: validCredentials.email
        })
      });

      // Verify token structure (JWT has 3 parts separated by dots)
      expect(response.body.token.split('.')).toHaveLength(3);
    });

    it('should return user information with token', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send(validCredentials)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(validCredentials.email);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });
  });

  describe('should return 401 when invalid credentials provided', () => {
    it('should return 401 when invalid credentials provided', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Invalid credentials')
      });
      expect(response.body.token).toBeUndefined();
    });

    it('should return 401 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('credentials')
      });
    });

    it('should return 401 when password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('credentials')
      });
    });
  });
});