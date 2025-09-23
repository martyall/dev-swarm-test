import request from 'supertest';
import { Server } from '../server';
import { Express } from 'express';

describe('Health Check Integration Tests', () => {
  let server: Server;
  let app: Express;

  beforeEach(() => {
    server = new Server({ env: 'test' });
    app = server.getApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('GET /health Endpoint', () => {
    it('should return 200 status code', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return correct response structure', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return status "ok"', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      const date = new Date(timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe('Health Check Response Timing', () => {
    it('should return current timestamp within reasonable bounds', async () => {
      const before = Date.now();

      const response = await request(app)
        .get('/health')
        .expect(200);

      const after = Date.now();
      const responseTime = new Date(response.body.timestamp).getTime();

      expect(responseTime).toBeGreaterThanOrEqual(before - 1000); // 1 second tolerance
      expect(responseTime).toBeLessThanOrEqual(after + 1000);
    });

    it('should return different timestamps on subsequent requests', async () => {
      const response1 = await request(app)
        .get('/health')
        .expect(200);

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await request(app)
        .get('/health')
        .expect(200);

      expect(response1.body.timestamp).not.toBe(response2.body.timestamp);

      const time1 = new Date(response1.body.timestamp).getTime();
      const time2 = new Date(response2.body.timestamp).getTime();

      expect(time2).toBeGreaterThan(time1);
    });
  });

  describe('Health Check Reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/health').expect(200)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
        expect(response.body.timestamp).toBeDefined();
      });
    });

    it('should work consistently across multiple calls', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body).toEqual({
          status: 'ok',
          timestamp: expect.any(String)
        });
      }
    });
  });

  describe('Health Check Headers and Security', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for common security headers added by helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should not expose sensitive server information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Should not contain sensitive information
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('password');
      expect(responseString).not.toContain('secret');
      expect(responseString).not.toContain('key');
      expect(responseString).not.toContain('token');
    });
  });

  describe('Health Check Method Support', () => {
    it('should only support GET method', async () => {
      await request(app)
        .get('/health')
        .expect(200);
    });

    it('should return 404 for POST method', async () => {
      await request(app)
        .post('/health')
        .expect(404);
    });

    it('should return 404 for PUT method', async () => {
      await request(app)
        .put('/health')
        .expect(404);
    });

    it('should return 404 for DELETE method', async () => {
      await request(app)
        .delete('/health')
        .expect(404);
    });

    it('should return 404 for PATCH method', async () => {
      await request(app)
        .patch('/health')
        .expect(404);
    });
  });

  describe('Health Check Environment Consistency', () => {
    it('should work consistently in test environment', async () => {
      const testServer = new Server({ env: 'test' });
      const testApp = testServer.getApp();

      const response = await request(testApp)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should work consistently in development environment', async () => {
      const devServer = new Server({ env: 'development' });
      const devApp = devServer.getApp();

      const response = await request(devApp)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should work consistently in production environment', async () => {
      const prodServer = new Server({ env: 'production' });
      const prodApp = prodServer.getApp();

      const response = await request(prodApp)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Health Check Performance', () => {
    it('should respond quickly to health checks', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should respond within 100ms under normal conditions
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid successive requests efficiently', async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 20 }, () =>
        request(app).get('/health').expect(200)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle 20 requests within 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});