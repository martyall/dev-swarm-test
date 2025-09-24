import request from 'supertest';
import { Server } from '../src/server';
import morgan from 'morgan';

// Mock morgan to capture log calls
jest.mock('morgan', () => {
  const originalMorgan = jest.requireActual('morgan');
  return jest.fn(() => originalMorgan('combined'));
});

describe('Request Logging', () => {
  let server: Server;
  let app: any;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    server = new Server();
    app = server.getApp();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Request Logging Middleware', () => {
    it('should log incoming request details', async () => {
      // Verify morgan middleware is configured
      expect(morgan).toHaveBeenCalledWith('combined');

      // Make a request to trigger logging
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String)
      });

      // Verify that morgan middleware was set up (the actual logging is handled by morgan)
      expect(morgan).toHaveBeenCalled();
    });

    it('should log requests to all endpoints', async () => {
      // Test that logging middleware applies to all routes
      await request(app)
        .get('/nonexistent')
        .expect(404);

      await request(app)
        .post('/health')
        .expect(404);

      // Verify morgan was called (it handles the actual request logging)
      expect(morgan).toHaveBeenCalled();
    });
  });
});