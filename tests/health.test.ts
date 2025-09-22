import request from 'supertest';
import { ExpressServer } from '../src/server';

describe('Health Endpoint', () => {
  let server: ExpressServer;

  beforeEach(async () => {
    server = new ExpressServer(0); // Use random port for testing
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('should return 200 status and correct JSON format for GET /health', () => {
    it('should return 200 status and correct JSON format for GET /health', async () => {
      const response = await request(server.getApp())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('ok');
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('should return valid ISO timestamp in health check response', () => {
    it('should return valid ISO timestamp in health check response', async () => {
      const response = await request(server.getApp())
        .get('/health')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();
      
      // Verify it's a valid ISO string by parsing it
      const parsedDate = new Date(timestamp);
      expect(parsedDate.toISOString()).toBe(timestamp);
      
      // Verify the timestamp is recent (within last 10 seconds)
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - parsedDate.getTime());
      expect(timeDiff).toBeLessThan(10000); // 10 seconds in milliseconds
    });
  });
});