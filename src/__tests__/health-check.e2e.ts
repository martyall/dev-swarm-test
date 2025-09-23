import { Server } from '../server';
import { Express } from 'express';
import http from 'http';

describe('Health Check E2E Tests', () => {
  let server: Server;
  let app: Express;
  let httpServer: http.Server;
  let port: number;

  beforeAll(async () => {
    // Use a random port for testing
    port = 0;
    server = new Server({ port, env: 'test' });
    app = server.getApp();

    // Start server
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

  describe('Health Check Endpoint Availability', () => {
    it('should be accessible via HTTP request', async () => {
      const response = await fetch(`http://localhost:${port}/health`);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    it('should return correct content type', async () => {
      const response = await fetch(`http://localhost:${port}/health`);

      expect(response.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('should return expected JSON structure', async () => {
      const response = await fetch(`http://localhost:${port}/health`);
      const data = await response.json();

      expect(data).toEqual({
        status: 'ok',
        timestamp: expect.any(String)
      });

      expect(data.status).toBe('ok');
      expect(typeof data.timestamp).toBe('string');
    });
  });

  describe('Health Check Timestamp Accuracy', () => {
    it('should return current timestamp', async () => {
      const before = Date.now();
      const response = await fetch(`http://localhost:${port}/health`);
      const after = Date.now();

      const data = await response.json();
      const responseTime = new Date(data.timestamp).getTime();

      expect(responseTime).toBeGreaterThanOrEqual(before - 1000);
      expect(responseTime).toBeLessThanOrEqual(after + 1000);
    });

    it('should return ISO 8601 formatted timestamp', async () => {
      const response = await fetch(`http://localhost:${port}/health`);
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      const date = new Date(data.timestamp);
      expect(date.toISOString()).toBe(data.timestamp);
    });

    it('should generate unique timestamps for concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        fetch(`http://localhost:${port}/health`).then(r => r.json())
      );

      const results = await Promise.all(promises);
      const timestamps = results.map(r => r.timestamp);

      // All timestamps should be unique (considering millisecond precision)
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(timestamps.length);
    });
  });

  describe('Health Check Reliability', () => {
    it('should handle high-frequency requests', async () => {
      const results = [];

      for (let i = 0; i < 50; i++) {
        const response = await fetch(`http://localhost:${port}/health`);
        const data = await response.json();

        results.push(data);

        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
        expect(data.timestamp).toBeDefined();
      }

      // All requests should have been successful
      expect(results).toHaveLength(50);
    });

    it('should maintain consistency under load', async () => {
      const batchSize = 20;
      const batches = 3;

      for (let batch = 0; batch < batches; batch++) {
        const promises = Array.from({ length: batchSize }, () =>
          fetch(`http://localhost:${port}/health`)
        );

        const responses = await Promise.all(promises);

        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        const dataPromises = responses.map(response => response.json());
        const data = await Promise.all(dataPromises);

        data.forEach(item => {
          expect(item.status).toBe('ok');
          expect(item.timestamp).toBeDefined();
        });

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    });
  });

  describe('Health Check HTTP Compliance', () => {
    it('should support HEAD method for health checks', async () => {
      const response = await fetch(`http://localhost:${port}/health`, {
        method: 'HEAD'
      });

      // HEAD should return same status but no body
      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toBe('');
    });

    it('should return appropriate status for unsupported methods', async () => {
      const unsupportedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of unsupportedMethods) {
        const response = await fetch(`http://localhost:${port}/health`, {
          method
        });

        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data.status).toBe('error');
        expect(data.message).toContain('not found');
      }
    });
  });

  describe('Health Check Security', () => {
    it('should include security headers', async () => {
      const response = await fetch(`http://localhost:${port}/health`);

      // Security headers from helmet
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBeDefined();
    });

    it('should include CORS headers', async () => {
      const response = await fetch(`http://localhost:${port}/health`);

      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });

    it('should not expose server internals', async () => {
      const response = await fetch(`http://localhost:${port}/health`);
      const data = await response.json();

      // Should only contain expected fields
      const expectedKeys = ['status', 'timestamp'];
      const actualKeys = Object.keys(data);

      expect(actualKeys).toEqual(expect.arrayContaining(expectedKeys));
      expect(actualKeys).toHaveLength(expectedKeys.length);
    });
  });

  describe('Health Check in Different Environments', () => {
    let prodServer: Server;
    let prodApp: Express;
    let prodHttpServer: http.Server;
    let prodPort: number;

    beforeAll(async () => {
      // Test production-like environment
      prodPort = 0;
      prodServer = new Server({ port: prodPort, env: 'production' });
      prodApp = prodServer.getApp();

      await new Promise<void>((resolve) => {
        prodHttpServer = prodApp.listen(prodPort, () => {
          const address = prodHttpServer.address();
          if (address && typeof address === 'object') {
            prodPort = address.port;
          }
          resolve();
        });
      });
    });

    afterAll(async () => {
      if (prodHttpServer) {
        await new Promise<void>((resolve) => {
          prodHttpServer.close(() => resolve());
        });
      }
    });

    it('should work consistently in production environment', async () => {
      const response = await fetch(`http://localhost:${prodPort}/health`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Health Check Performance Metrics', () => {
    it('should respond within acceptable time limits', async () => {
      const measurements = [];

      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        const response = await fetch(`http://localhost:${port}/health`);
        const end = performance.now();

        expect(response.status).toBe(200);

        measurements.push(end - start);
      }

      // Calculate average response time
      const averageTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;

      // Should respond within 50ms on average
      expect(averageTime).toBeLessThan(50);

      // No single request should take longer than 100ms
      measurements.forEach(time => {
        expect(time).toBeLessThan(100);
      });
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrency = 25;
      const start = performance.now();

      const promises = Array.from({ length: concurrency }, () =>
        fetch(`http://localhost:${port}/health`)
      );

      const responses = await Promise.all(promises);
      const end = performance.now();

      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Total time for all concurrent requests should be reasonable
      const totalTime = end - start;
      expect(totalTime).toBeLessThan(200); // 200ms for 25 concurrent requests
    });
  });

  describe('Health Check Server State', () => {
    it('should accurately reflect server operational status', async () => {
      const response = await fetch(`http://localhost:${port}/health`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');

      // If we can reach the endpoint, the server is operational
      expect(data.status).toBe('ok');
    });

    it('should be available immediately after server start', async () => {
      // Health check should work immediately after the server starts
      const response = await fetch(`http://localhost:${port}/health`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
    });
  });
});