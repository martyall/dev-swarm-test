import request from 'supertest';
import { Server } from '../server';
import { Express } from 'express';

describe('Error Handling Integration Tests', () => {
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

  describe('Error Middleware Integration', () => {
    beforeEach(() => {
      // Add test routes that throw errors
      app.get('/test-sync-error', () => {
        throw new Error('Synchronous test error');
      });

      app.get('/test-async-error', async () => {
        throw new Error('Asynchronous test error');
      });

      app.get('/test-custom-error', () => {
        const error = new Error('Custom test error');
        (error as any).statusCode = 422;
        throw error;
      });

      app.get('/test-null-error', () => {
        throw null;
      });

      app.get('/test-string-error', () => {
        throw 'String error';
      });
    });

    it('should handle synchronous errors', async () => {
      const response = await request(app)
        .get('/test-sync-error')
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Synchronous test error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle asynchronous errors', async () => {
      const response = await request(app)
        .get('/test-async-error')
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Asynchronous test error');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle custom errors with additional properties', async () => {
      const response = await request(app)
        .get('/test-custom-error')
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Custom test error');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle non-Error objects gracefully', async () => {
      const response = await request(app)
        .get('/test-null-error')
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle string errors', async () => {
      const response = await request(app)
        .get('/test-string-error')
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Environment-specific Error Responses', () => {
    it('should show detailed error messages in test environment', async () => {
      const testServer = new Server({ env: 'test' });
      const testApp = testServer.getApp();

      testApp.get('/test-error', () => {
        throw new Error('Detailed test error information');
      });

      const response = await request(testApp)
        .get('/test-error')
        .expect(500);

      expect(response.body.message).toBe('Detailed test error information');
    });

    it('should show detailed error messages in development environment', async () => {
      const devServer = new Server({ env: 'development' });
      const devApp = devServer.getApp();

      devApp.get('/test-error', () => {
        throw new Error('Detailed development error information');
      });

      const response = await request(devApp)
        .get('/test-error')
        .expect(500);

      expect(response.body.message).toBe('Detailed development error information');
    });

    it('should hide error details in production environment', async () => {
      const prodServer = new Server({ env: 'production' });
      const prodApp = prodServer.getApp();

      prodApp.get('/test-error', () => {
        throw new Error('Sensitive production error details');
      });

      const response = await request(prodApp)
        .get('/test-error')
        .expect(500);

      expect(response.body.message).toBe('Internal server error');
      expect(response.body.message).not.toContain('Sensitive');
    });
  });

  describe('Error Logging Integration', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      app.get('/test-logged-error', () => {
        throw new Error('Error that should be logged');
      });
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log error message to console', async () => {
      await request(app)
        .get('/test-logged-error')
        .expect(500);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Server Error:', 'Error that should be logged');
    });

    it('should log error stack trace to console', async () => {
      await request(app)
        .get('/test-logged-error')
        .expect(500);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack:', expect.stringContaining('Error that should be logged'));
    });
  });

  describe('Error Response Headers', () => {
    beforeEach(() => {
      app.get('/test-headers-error', () => {
        throw new Error('Headers test error');
      });
    });

    it('should return JSON content type for error responses', async () => {
      const response = await request(app)
        .get('/test-headers-error')
        .expect(500);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include security headers in error responses', async () => {
      const response = await request(app)
        .get('/test-headers-error')
        .expect(500);

      // Security headers from helmet should be present
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should include CORS headers in error responses', async () => {
      const response = await request(app)
        .get('/test-headers-error')
        .expect(500);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Multiple Error Scenarios', () => {
    beforeEach(() => {
      app.get('/test-multiple-errors', (req, res, next) => {
        // Simulate multiple errors
        setTimeout(() => {
          next(new Error('First error'));
        }, 0);

        setTimeout(() => {
          next(new Error('Second error'));
        }, 10);
      });
    });

    it('should handle the first error and ignore subsequent ones', async () => {
      const response = await request(app)
        .get('/test-multiple-errors')
        .expect(500);

      expect(response.body.message).toBe('First error');
    });
  });

  describe('Error Handler Positioning', () => {
    it('should catch errors from routes defined before error handler', async () => {
      // The error routes added in beforeEach should be caught by the error handler
      const response = await request(app)
        .get('/test-sync-error')
        .expect(500);

      expect(response.body.status).toBe('error');
    });

    it('should not interfere with successful requests', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });
});