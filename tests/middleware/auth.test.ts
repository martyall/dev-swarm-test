import request from 'supertest';
import express from 'express';
import { authMiddleware } from '../../src/middleware/auth';
import { generateToken } from '../../src/utils/jwt';

const app = express();
app.use(express.json());

// Test route that uses auth middleware
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});

describe('Auth Middleware', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };

  describe('should reject access with invalid or missing token', () => {
    it('should reject access with invalid or missing token', async () => {
      // Test missing token
      const missingTokenResponse = await request(app)
        .get('/protected')
        .expect(401);

      expect(missingTokenResponse.body).toMatchObject({
        error: expect.stringContaining('token')
      });

      // Test invalid token
      const invalidTokenResponse = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(invalidTokenResponse.body).toMatchObject({
        error: expect.stringContaining('token')
      });
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('token')
      });
    });
  });

  describe('should allow access to protected route with valid token', () => {
    it('should allow access to protected route with valid token', async () => {
      const validToken = generateToken(mockUser);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Access granted',
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email
        })
      });
    });
  });
});