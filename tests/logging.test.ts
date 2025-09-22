import request from 'supertest';
import { ExpressServer } from '../src/server';

describe('Request Logging', () => {
  let server: ExpressServer;
  let consoleSpy: jest.SpyInstance;

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    server = new ExpressServer(0); // Use random port for testing
    await server.start();
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    await server.stop();
  });

  describe('should log request method and URL for incoming requests', () => {
    it('should log request method and URL for incoming requests', async () => {
      await request(server.getApp())
        .get('/health')
        .expect(200);

      // Check that the request was logged
      expect(consoleSpy).toHaveBeenCalledWith('GET /health');
    });

    it('should log different request methods and URLs', async () => {
      // Make multiple requests to different endpoints
      await request(server.getApp())
        .get('/health')
        .expect(200);

      await request(server.getApp())
        .get('/test-error')
        .expect(500);

      // Verify all requests were logged
      expect(consoleSpy).toHaveBeenCalledWith('GET /health');
      expect(consoleSpy).toHaveBeenCalledWith('GET /test-error');
    });
  });
});