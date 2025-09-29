import request from 'supertest';
import { createServer, ExpressServer } from '../src/server.js';
import Logger from '../src/utils/logger.js';

// Mock Logger for cleaner test output
jest.mock('../src/utils/logger.js');
const mockLogger = Logger as jest.Mocked<typeof Logger>;

describe('Health Check E2E Tests', () => {
  let server: ExpressServer;
  let baseURL: string;

  beforeAll(async () => {
    // Create server for e2e testing
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    const address = server.getAddress();
    baseURL = `http://${address}`;

    console.log(`E2E Test server started on ${baseURL}`);
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
      console.log('E2E Test server stopped');
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 status and healthy response', async () => {
      const response = await request(server.getApp())
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: expect.any(String),
        metrics: expect.objectContaining({
          memory: expect.objectContaining({
            used: expect.any(Number),
            total: expect.any(Number),
            usage: expect.any(Number)
          }),
          cpu: expect.objectContaining({
            loadAverage: expect.any(Array),
            cores: expect.any(Number)
          }),
          system: expect.objectContaining({
            platform: expect.any(String),
            nodeVersion: expect.any(String),
            hostname: expect.any(String)
          })
        })
      });
    });

    it('should return consistent data structure across multiple requests', async () => {
      const response1 = await request(server.getApp())
        .get('/health')
        .expect(200);

      const response2 = await request(server.getApp())
        .get('/health')
        .expect(200);

      // Both responses should have the same structure
      const keys1 = Object.keys(response1.body).sort();
      const keys2 = Object.keys(response2.body).sort();
      expect(keys1).toEqual(keys2);

      // Metrics should have consistent structure
      const metricsKeys1 = Object.keys(response1.body.metrics).sort();
      const metricsKeys2 = Object.keys(response2.body.metrics).sort();
      expect(metricsKeys1).toEqual(metricsKeys2);
    });

    it('should include valid timestamp in ISO format', async () => {
      const response = await request(server.getApp())
        .get('/health')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toBeTruthy();

      // Should be a valid ISO date string
      const date = new Date(timestamp);
      expect(date.toISOString()).toBe(timestamp);

      // Should be recent (within last 5 seconds)
      const now = new Date();
      const timeDiff = now.getTime() - date.getTime();
      expect(timeDiff).toBeLessThan(5000);
    });

    it('should return increasing uptime across requests', async () => {
      const response1 = await request(server.getApp())
        .get('/health')
        .expect(200);

      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await request(server.getApp())
        .get('/health')
        .expect(200);

      expect(response2.body.uptime).toBeGreaterThanOrEqual(response1.body.uptime);
    });

    it('should handle concurrent health check requests', async () => {
      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() =>
        request(server.getApp())
          .get('/health')
          .expect(200)
      );

      const responses = await Promise.all(promises);

      // All should return successful responses with required structure
      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
        expect(response.body).toHaveProperty('metrics');
        expect(response.body).toHaveProperty('timestamp');
      });
    });

    it('should log health check requests', async () => {
      await request(server.getApp())
        .get('/health')
        .expect(200);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Health check requested',
        expect.objectContaining({
          uptime: expect.any(Number),
          memoryUsage: expect.any(Number)
        })
      );
    });
  });

  describe('Server Integration', () => {
    it('should respond to health checks while server is running', async () => {
      expect(server.isListening()).toBe(true);

      await request(server.getApp())
        .get('/health')
        .expect(200);
    });

    it('should include correct environment in health response', async () => {
      const response = await request(server.getApp())
        .get('/health')
        .expect(200);

      // Should reflect the test environment
      expect(['test', 'development']).toContain(response.body.environment);
    });
  });
});