import request from 'supertest';
import { Server } from '../server';
import { Express } from 'express';

describe('Server Integration Tests', () => {
  let server: Server;
  let app: Express;

  beforeEach(() => {
    server = new Server({ env: 'test' });
    app = server.getApp();
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 status and correct response format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return Content-Type application/json', async () => {
      await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);
    });
  });

  describe('404 Not Found Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Route /nonexistent-route not found');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 404 for POST to undefined routes', async () => {
      const response = await request(app)
        .post('/nonexistent-route')
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('/nonexistent-route not found');
    });
  });

  describe('Middleware Integration', () => {
    it('should handle JSON request body', async () => {
      // Since we don't have a POST endpoint yet, we'll test that JSON parsing doesn't break
      const response = await request(app)
        .post('/nonexistent')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json')
        .expect(404);

      expect(response.body.status).toBe('error');
    });

    it('should handle URL-encoded request body', async () => {
      const response = await request(app)
        .post('/nonexistent')
        .send('test=data')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(404);

      expect(response.body.status).toBe('error');
    });

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

      // Check for CORS headers
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Create a server with a route that throws an error
      const testServer = new Server({ env: 'test' });
      const testApp = testServer.getApp();

      // Add a route that throws an error for testing
      testApp.get('/error-test', () => {
        throw new Error('Test error');
      });

      const response = await request(testApp)
        .get('/error-test')
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Test error');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should hide error details in production environment', async () => {
      const prodServer = new Server({ env: 'production' });
      const prodApp = prodServer.getApp();

      // Add a route that throws an error for testing
      prodApp.get('/error-test', () => {
        throw new Error('Sensitive error details');
      });

      const response = await request(prodApp)
        .get('/error-test')
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Internal server error');
      expect(response.body.message).not.toContain('Sensitive error details');
    });
  });

  describe('Request Logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should not interfere with request processing', async () => {
      await request(app)
        .get('/health')
        .expect(200);

      // Request should complete successfully regardless of logging
      expect(true).toBe(true);
    });
  });
});