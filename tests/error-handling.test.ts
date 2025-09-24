import request from 'supertest';
import { Server } from '../src/server';
import express from 'express';

describe('Error Handling', () => {
  let server: Server;
  let app: any;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    server = new Server();
    app = server.getApp();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Error Middleware', () => {
    it('should handle errors gracefully without server crash', async () => {
      // Add a route that throws an error for testing
      app.get('/test-error', (req: any, res: any, next: any) => {
        const error = new Error('Test error');
        next(error);
      });

      const response = await request(app)
        .get('/test-error')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Server Error:', {
        message: 'Test error',
        stack: expect.any(String),
        url: '/test-error',
        method: 'GET',
        timestamp: expect.any(String)
      });
    });

    it('should handle synchronous errors in routes', async () => {
      // Add a route that throws a synchronous error
      app.get('/sync-error', (req: any, res: any) => {
        throw new Error('Synchronous error');
      });

      const response = await request(app)
        .get('/sync-error')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/health')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express built-in JSON parser handles this, but our error handler should still work
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not Found',
        message: 'Route /nonexistent-route not found'
      });
    });
  });
});