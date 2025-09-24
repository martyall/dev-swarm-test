import request from 'supertest';
import { Server } from '../src/server';

describe('Health Check Endpoint', () => {
  let server: Server;
  let app: any;

  beforeEach(() => {
    server = new Server();
    app = server.getApp();
  });

  describe('GET /health', () => {
    it('should return 200 status and correct JSON structure for GET /health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('ok');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return valid ISO timestamp in health check response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String)
      });

      // Verify timestamp is a valid ISO string
      const timestamp = response.body.timestamp;
      expect(() => new Date(timestamp)).not.toThrow();

      // Verify it's in ISO 8601 format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(timestamp).toMatch(isoRegex);

      // Verify the timestamp is recent (within last 5 seconds)
      const timestampDate = new Date(timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - timestampDate.getTime();
      expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds
    });

    it('should return fresh timestamp on each request', async () => {
      const response1 = await request(app)
        .get('/health')
        .expect(200);

      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await request(app)
        .get('/health')
        .expect(200);

      expect(response1.body.timestamp).not.toBe(response2.body.timestamp);
      expect(response1.body.status).toBe('ok');
      expect(response2.body.status).toBe('ok');
    });

    it('should set correct content type header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Health Endpoint Error Cases', () => {
    it('should only accept GET requests on /health', async () => {
      await request(app)
        .post('/health')
        .expect(404);

      await request(app)
        .put('/health')
        .expect(404);

      await request(app)
        .delete('/health')
        .expect(404);
    });
  });
});