import request from 'supertest';
import { ExpressServer } from '../src/server';

describe('Error Handling', () => {
  let server: ExpressServer;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    server = new ExpressServer(0); // Use random port for testing
    await server.start();
  });

  afterEach(async () => {
    consoleErrorSpy.mockRestore();
    await server.stop();
  });

  describe('should handle and log errors without crashing server', () => {
    it('should handle and log errors without crashing server', async () => {
      // Make request to error endpoint
      const response = await request(server.getApp())
        .get('/test-error')
        .expect(500);

      // Verify error response format
      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error occurred: Test error for error handling');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Stack trace:'));

      // Verify server is still running by making another request
      await request(server.getApp())
        .get('/health')
        .expect(200);
    });

    it('should continue handling requests after an error', async () => {
      // Trigger an error
      await request(server.getApp())
        .get('/test-error')
        .expect(500);

      // Verify server can still handle normal requests
      const healthResponse = await request(server.getApp())
        .get('/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('ok');
    });
  });
});