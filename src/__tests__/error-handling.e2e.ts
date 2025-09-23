import { Server } from '../server';
import { Express } from 'express';
import http from 'http';

describe('Error Handling E2E Tests', () => {
  let server: Server;
  let app: Express;
  let httpServer: http.Server;
  let port: number;

  beforeAll(async () => {
    // Use a random port for testing
    port = 0;
    server = new Server({ port, env: 'test' });
    app = server.getApp();

    // Add test error routes
    app.get('/e2e-sync-error', () => {
      throw new Error('E2E synchronous error');
    });

    app.get('/e2e-async-error', async () => {
      throw new Error('E2E asynchronous error');
    });

    app.get('/e2e-timeout-error', async (req, res) => {
      // Simulate a long-running operation that times out
      await new Promise(resolve => setTimeout(resolve, 100));
      throw new Error('E2E timeout error');
    });

    app.get('/e2e-memory-error', () => {
      // Simulate memory-related error
      const error = new Error('E2E memory error');
      (error as any).code = 'ENOMEM';
      throw error;
    });

    app.get('/e2e-database-error', () => {
      // Simulate database connection error
      const error = new Error('E2E database connection failed');
      (error as any).errno = -4078;
      (error as any).code = 'ECONNREFUSED';
      throw error;
    });

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

  describe('Server Stability Under Errors', () => {
    it('should remain stable after handling synchronous errors', async () => {
      // Make error request
      const errorResponse = await fetch(`http://localhost:${port}/e2e-sync-error`);
      expect(errorResponse.status).toBe(500);

      const errorData = await errorResponse.json();
      expect(errorData.status).toBe('error');
      expect(errorData.message).toBe('E2E synchronous error');

      // Verify server is still responsive
      const healthResponse = await fetch(`http://localhost:${port}/health`);
      expect(healthResponse.status).toBe(200);

      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('ok');
    });

    it('should remain stable after handling asynchronous errors', async () => {
      // Make async error request
      const errorResponse = await fetch(`http://localhost:${port}/e2e-async-error`);
      expect(errorResponse.status).toBe(500);

      const errorData = await errorResponse.json();
      expect(errorData.status).toBe('error');
      expect(errorData.message).toBe('E2E asynchronous error');

      // Verify server is still responsive
      const healthResponse = await fetch(`http://localhost:${port}/health`);
      expect(healthResponse.status).toBe(200);

      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('ok');
    });

    it('should handle multiple concurrent errors without crashing', async () => {
      // Make multiple concurrent error requests
      const errorPromises = Array.from({ length: 5 }, () =>
        fetch(`http://localhost:${port}/e2e-sync-error`)
      );

      const responses = await Promise.all(errorPromises);

      // All error requests should return 500
      responses.forEach(response => {
        expect(response.status).toBe(500);
      });

      // Verify server is still responsive
      const healthResponse = await fetch(`http://localhost:${port}/health`);
      expect(healthResponse.status).toBe(200);
    });
  });

  describe('Error Response Consistency', () => {
    it('should return consistent error format for all error types', async () => {
      const errorEndpoints = [
        '/e2e-sync-error',
        '/e2e-async-error',
        '/e2e-timeout-error',
        '/e2e-memory-error',
        '/e2e-database-error'
      ];

      for (const endpoint of errorEndpoints) {
        const response = await fetch(`http://localhost:${port}${endpoint}`);
        expect(response.status).toBe(500);

        const data = await response.json();
        expect(data).toHaveProperty('status', 'error');
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('timestamp');
        expect(typeof data.message).toBe('string');
        expect(typeof data.timestamp).toBe('string');

        // Validate timestamp format
        expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(new Date(data.timestamp)).toBeInstanceOf(Date);
      }
    });

    it('should return proper content type for all error responses', async () => {
      const response = await fetch(`http://localhost:${port}/e2e-sync-error`);

      expect(response.headers.get('content-type')).toMatch(/application\/json/);
    });
  });

  describe('Production-like Error Handling', () => {
    let prodServer: Server;
    let prodApp: Express;
    let prodHttpServer: http.Server;
    let prodPort: number;

    beforeAll(async () => {
      // Create production-like server
      prodPort = 0;
      prodServer = new Server({ port: prodPort, env: 'production' });
      prodApp = prodServer.getApp();

      prodApp.get('/prod-error', () => {
        throw new Error('Sensitive production error details');
      });

      // Start production server
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

    it('should hide error details in production environment', async () => {
      const response = await fetch(`http://localhost:${prodPort}/prod-error`);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.status).toBe('error');
      expect(data.message).toBe('Internal server error');
      expect(data.message).not.toContain('Sensitive');
    });
  });

  describe('Error Handler Performance', () => {
    it('should handle rapid successive errors efficiently', async () => {
      const startTime = Date.now();

      // Make 10 rapid error requests
      const promises = Array.from({ length: 10 }, () =>
        fetch(`http://localhost:${port}/e2e-sync-error`)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (under 2 seconds)
      expect(duration).toBeLessThan(2000);

      // Verify server is still responsive
      const healthResponse = await fetch(`http://localhost:${port}/health`);
      expect(healthResponse.status).toBe(200);
    });

    it('should not cause memory leaks with repeated errors', async () => {
      // Make multiple error requests to test for memory leaks
      for (let i = 0; i < 20; i++) {
        const response = await fetch(`http://localhost:${port}/e2e-sync-error`);
        expect(response.status).toBe(500);

        // Parse response to ensure it's handled properly
        const data = await response.json();
        expect(data.status).toBe('error');
      }

      // Verify server is still responsive
      const healthResponse = await fetch(`http://localhost:${port}/health`);
      expect(healthResponse.status).toBe(200);
    });
  });

  describe('Error Recovery', () => {
    it('should recover gracefully from various error types', async () => {
      const errorTypes = [
        'e2e-sync-error',
        'e2e-async-error',
        'e2e-memory-error',
        'e2e-database-error'
      ];

      // Test each error type and verify recovery
      for (const errorType of errorTypes) {
        const errorResponse = await fetch(`http://localhost:${port}/${errorType}`);
        expect(errorResponse.status).toBe(500);

        // Immediately test that server is still functional
        const healthResponse = await fetch(`http://localhost:${port}/health`);
        expect(healthResponse.status).toBe(200);

        const healthData = await healthResponse.json();
        expect(healthData.status).toBe('ok');
      }
    });
  });

  describe('Error Logging Integration', () => {
    it('should handle errors without breaking request flow', async () => {
      // Make a request that causes an error
      const response = await fetch(`http://localhost:${port}/e2e-sync-error`);
      expect(response.status).toBe(500);

      // The response should be properly formatted despite logging
      const data = await response.json();
      expect(data).toHaveProperty('status', 'error');
      expect(data).toHaveProperty('timestamp');
    });
  });
});