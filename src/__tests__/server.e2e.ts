import { Server } from '../server';
import { Express } from 'express';
import http from 'http';

describe('Server E2E Tests', () => {
  let server: Server;
  let app: Express;
  let httpServer: http.Server;
  let port: number;

  beforeAll(async () => {
    // Use a random port for testing to avoid conflicts
    port = 0; // Let the OS assign a random available port
    server = new Server({ port, env: 'test' });
    app = server.getApp();

    // Start server in background
    await new Promise<void>((resolve) => {
      httpServer = app.listen(port, () => {
        const address = httpServer.address();
        if (address && typeof address === 'object') {
          port = address.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  describe('Server Lifecycle', () => {
    it('should start server and listen on configured port', () => {
      expect(httpServer).toBeDefined();
      expect(httpServer.listening).toBe(true);

      const address = httpServer.address();
      expect(address).not.toBeNull();
      if (address && typeof address === 'object') {
        expect(address.port).toBeGreaterThan(0);
      }
    });

    it('should be accessible via HTTP requests', async () => {
      const response = await fetch(`http://localhost:${port}/health`);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Health Check Endpoint E2E', () => {
    it('should respond to health check requests', async () => {
      const response = await fetch(`http://localhost:${port}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        version: expect.any(String),
        memory: expect.any(Object),
        pid: expect.any(Number)
      });

      // Verify timestamp is a valid ISO string
      const timestamp = new Date(data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return current timestamp on each request', async () => {
      const response1 = await fetch(`http://localhost:${port}/health`);
      const data1 = await response1.json();

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await fetch(`http://localhost:${port}/health`);
      const data2 = await response2.json();

      expect(data1.timestamp).not.toBe(data2.timestamp);
      expect(new Date(data1.timestamp).getTime()).toBeLessThan(new Date(data2.timestamp).getTime());
    });
  });

  describe('Error Handling E2E', () => {
    it('should handle 404 errors for non-existent endpoints', async () => {
      const response = await fetch(`http://localhost:${port}/nonexistent`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        status: 'error',
        message: 'Route /nonexistent not found',
        timestamp: expect.any(String)
      });
    });

    it('should handle different HTTP methods on non-existent endpoints', async () => {
      const response = await fetch(`http://localhost:${port}/nonexistent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.status).toBe('error');
      expect(data.message).toContain('/nonexistent not found');
    });
  });

  describe('Content Type Handling E2E', () => {
    it('should return JSON content type for health endpoint', async () => {
      const response = await fetch(`http://localhost:${port}/health`);

      expect(response.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('should return JSON content type for error responses', async () => {
      const response = await fetch(`http://localhost:${port}/nonexistent`);

      expect(response.headers.get('content-type')).toMatch(/application\/json/);
    });
  });

  describe('Security Headers E2E', () => {
    it('should include security headers in responses', async () => {
      const response = await fetch(`http://localhost:${port}/health`);

      // Check for security headers added by helmet
      expect(response.headers.get('x-content-type-options')).toBeDefined();
      expect(response.headers.get('x-frame-options')).toBeDefined();
    });

    it('should include CORS headers in responses', async () => {
      const response = await fetch(`http://localhost:${port}/health`);

      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });

  describe('Request Logging E2E', () => {
    it('should handle concurrent requests without logging interference', async () => {
      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        fetch(`http://localhost:${port}/health`)
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify all responses have correct data
      const dataPromises = responses.map(response => response.json());
      const data = await Promise.all(dataPromises);

      data.forEach(item => {
        expect(item.status).toBe('ok');
        expect(item.timestamp).toBeDefined();
      });
    });
  });
});