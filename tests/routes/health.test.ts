import request from 'supertest';
import express from 'express';
import { HealthController, Logger } from '../../src/controllers/health.controller';

describe('Health Routes', () => {
  let app: express.Application;
  let mockLogger: Logger;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    // Create Express app
    app = express();
    app.use(express.json());

    // Create health controller instance
    const healthController = new HealthController(
      'test-service',
      '1.0.0',
      'test',
      mockLogger
    );

    // Set up health route
    app.get('/health', (req, res) => healthController.getHealth(req, res));
  });

  describe('should return 200 OK status for GET /health endpoint', () => {
    it('should return 200 OK status for GET /health endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('health');
      expect(response.body.health).toHaveProperty('status');
      expect(response.body.health).toHaveProperty('timestamp');
      expect(response.body.health).toHaveProperty('uptime');

      // Verify health status is healthy
      expect(response.body.health.status).toBe('healthy');

      // Verify service information
      expect(response.body.service).toBe('test-service');

      // Verify Content-Type header
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return consistent response structure on multiple calls', async () => {
      // Make multiple requests
      const response1 = await request(app).get('/health').expect(200);
      const response2 = await request(app).get('/health').expect(200);

      // Both responses should have same structure
      expect(response1.body).toHaveProperty('service');
      expect(response1.body).toHaveProperty('health');
      expect(response2.body).toHaveProperty('service');
      expect(response2.body).toHaveProperty('health');

      // Service name should be consistent
      expect(response1.body.service).toBe(response2.body.service);

      // Health status should be healthy for both
      expect(response1.body.health.status).toBe('healthy');
      expect(response2.body.health.status).toBe('healthy');

      // Uptime should increase between calls (or be same if calls are very fast)
      expect(response2.body.health.uptime).toBeGreaterThanOrEqual(response1.body.health.uptime);
    });

    it('should include required health check fields', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Verify all required fields are present
      expect(response.body.service).toBeDefined();
      expect(response.body.health.status).toBeDefined();
      expect(response.body.health.timestamp).toBeDefined();
      expect(response.body.health.uptime).toBeDefined();

      // Verify field types
      expect(typeof response.body.service).toBe('string');
      expect(typeof response.body.health.status).toBe('string');
      expect(typeof response.body.health.timestamp).toBe('string');
      expect(typeof response.body.health.uptime).toBe('number');

      // Verify timestamp is valid ISO string
      expect(() => new Date(response.body.health.timestamp)).not.toThrow();

      // Verify uptime is non-negative
      expect(response.body.health.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should trigger appropriate logging on health check request', async () => {
      await request(app)
        .get('/health')
        .expect(200);

      // Verify logging was called
      expect(mockLogger.info).toHaveBeenCalled();

      // Check for request received log
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Health check request received',
        expect.objectContaining({
          ip: expect.any(String),
          timestamp: expect.any(String)
        })
      );

      // Check for completion log
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Health check completed successfully',
        expect.objectContaining({
          service: 'test-service',
          status: 'healthy',
          uptime: expect.any(Number)
        })
      );
    });
  });
});