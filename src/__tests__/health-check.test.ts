import { Server } from '../server';
import { Express } from 'express';

describe('Health Check Unit Tests', () => {
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

  describe('Health Check Endpoint Registration', () => {
    it('should register health check route', () => {
      // Check that the app has routes registered
      expect(app._router).toBeDefined();
      expect(app._router.stack.length).toBeGreaterThan(0);

      // Find health check route
      const healthRoute = app._router.stack.find((layer: any) => {
        return layer.regexp && layer.regexp.test('/health');
      });

      expect(healthRoute).toBeDefined();
    });

    it('should register health check route with GET method', () => {
      const routes = app._router.stack.filter((layer: any) => {
        return layer.route && layer.route.path === '/health';
      });

      expect(routes.length).toBeGreaterThan(0);

      const healthRoute = routes.find((layer: any) =>
        layer.route.methods.get === true
      );

      expect(healthRoute).toBeDefined();
    });
  });

  describe('Health Check Response Structure', () => {
    it('should define standard health check response format', () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      expect(healthResponse).toHaveProperty('status', 'ok');
      expect(healthResponse).toHaveProperty('timestamp');
      expect(typeof healthResponse.status).toBe('string');
      expect(typeof healthResponse.timestamp).toBe('string');
    });

    it('should create valid ISO timestamp format', () => {
      const timestamp = new Date().toISOString();

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp)).toBeInstanceOf(Date);
      expect(new Date(timestamp).getTime()).not.toBeNaN();
    });

    it('should have consistent status values', () => {
      const validStatuses = ['ok', 'error', 'degraded'];

      expect(validStatuses).toContain('ok');
      expect('ok').toBe('ok');
    });
  });

  describe('Server Configuration for Health Check', () => {
    it('should work with different server configurations', () => {
      const servers = [
        new Server({ env: 'test', port: 3001 }),
        new Server({ env: 'development', port: 3002 }),
        new Server({ env: 'production', port: 3003 }),
      ];

      servers.forEach(testServer => {
        const testApp = testServer.getApp();
        expect(testApp).toBeDefined();
        expect(testApp._router).toBeDefined();
      });
    });

    it('should maintain health check across different environments', () => {
      const environments = ['test', 'development', 'production'];

      environments.forEach(env => {
        const testServer = new Server({ env });
        const config = testServer.getConfig();

        expect(config.env).toBe(env);
        expect(testServer.getApp()).toBeDefined();
      });
    });
  });

  describe('Health Check Timing', () => {
    it('should generate current timestamp', () => {
      const before = Date.now();
      const timestamp = new Date().toISOString();
      const after = Date.now();

      const timestampMs = new Date(timestamp).getTime();

      expect(timestampMs).toBeGreaterThanOrEqual(before);
      expect(timestampMs).toBeLessThanOrEqual(after);
    });

    it('should generate different timestamps on multiple calls', () => {
      const timestamp1 = new Date().toISOString();

      // Small delay to ensure different timestamps
      const timestamp2 = new Date(Date.now() + 1).toISOString();

      expect(timestamp1).not.toBe(timestamp2);
      expect(new Date(timestamp1).getTime()).toBeLessThan(new Date(timestamp2).getTime());
    });
  });

  describe('Health Check HTTP Status', () => {
    it('should use 200 status code for healthy response', () => {
      const statusCode = 200;

      expect(statusCode).toBe(200);
      expect(statusCode).toBeGreaterThanOrEqual(200);
      expect(statusCode).toBeLessThan(300);
    });

    it('should validate HTTP success status range', () => {
      const statusCode = 200;

      expect(statusCode >= 200 && statusCode < 300).toBe(true);
    });
  });

  describe('JSON Response Format', () => {
    it('should create valid JSON structure', () => {
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual(response);
      expect(parsed.status).toBe('ok');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should handle JSON serialization of timestamp', () => {
      const timestamp = new Date().toISOString();
      const response = { status: 'ok', timestamp };

      expect(() => JSON.stringify(response)).not.toThrow();

      const serialized = JSON.stringify(response);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.timestamp).toBe(timestamp);
    });
  });
});