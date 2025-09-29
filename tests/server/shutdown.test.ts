import { createServer, ExpressServer } from '../../src/server.js';
import Logger from '../../src/utils/logger.js';
import request from 'supertest';

// Mock Logger
jest.mock('../../src/utils/logger.js');
const mockLogger = Logger as jest.Mocked<typeof Logger>;

describe('Express Server Shutdown', () => {
  let server: ExpressServer;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (server && server.isListening()) {
      await server.stop();
    }
  });

  // Required Test 416/test-006
  test('should handle graceful shutdown when receiving SIGTERM', async () => {
    // Start server
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    // Verify server is listening
    expect(server.isListening()).toBe(true);

    // Make a request to ensure there are active connections
    const requestPromise = request(server.getApp())
      .get('/health')
      .expect(200);

    // Wait a bit to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate graceful shutdown (this would normally be triggered by process.kill)
    // Since we can't easily test actual SIGTERM in Jest, we'll test the stop() method
    // which is what gets called in the SIGTERM handler
    const shutdownPromise = server.stop();

    // Complete the request
    const response = await requestPromise;
    expect(response.body.status).toBe('healthy');

    // Verify graceful shutdown completes
    await expect(shutdownPromise).resolves.toBeUndefined();

    // Verify server is no longer listening
    expect(server.isListening()).toBe(false);

    // Verify successful shutdown was logged
    expect(mockLogger.info).toHaveBeenCalledWith('Express server stopped successfully');

    // Verify no error was logged during shutdown
    expect(mockLogger.error).not.toHaveBeenCalledWith(
      expect.stringContaining('Error stopping server'),
      expect.any(Object)
    );
  });

  test('should handle multiple concurrent requests during shutdown', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    // Start multiple concurrent requests
    const requestPromises = Array.from({ length: 5 }, () =>
      request(server.getApp())
        .get('/health')
        .expect(200)
    );

    // Wait a bit to ensure connections are established
    await new Promise(resolve => setTimeout(resolve, 10));

    // Start shutdown process
    const shutdownPromise = server.stop();

    // Wait for all requests to complete
    const responses = await Promise.all(requestPromises);

    // Verify all requests completed successfully
    responses.forEach(response => {
      expect(response.body.status).toBe('healthy');
    });

    // Verify graceful shutdown completes
    await expect(shutdownPromise).resolves.toBeUndefined();

    expect(server.isListening()).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith('Express server stopped successfully');
  });

  test('should handle shutdown when no active connections exist', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    expect(server.isListening()).toBe(true);

    // Shutdown immediately without any requests
    await expect(server.stop()).resolves.toBeUndefined();

    expect(server.isListening()).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith('Express server stopped successfully');
  });

  test('should handle shutdown timeout gracefully', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    // Create a long-running request
    server.getApp().get('/slow', (_req, res) => {
      setTimeout(() => {
        res.json({ message: 'slow response' });
      }, 100); // 100ms delay
    });

    // Start a slow request
    const slowRequestPromise = request(server.getApp())
      .get('/slow')
      .timeout(200); // 200ms timeout

    // Wait a bit to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 10));

    // Start shutdown
    const shutdownPromise = server.stop();

    // Both should complete successfully
    await expect(slowRequestPromise).resolves.toBeDefined();
    await expect(shutdownPromise).resolves.toBeUndefined();

    expect(server.isListening()).toBe(false);
  });

  test('should log graceful shutdown process', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    // Clear previous logs from server start
    mockLogger.info.mockClear();

    await server.stop();

    expect(mockLogger.info).toHaveBeenCalledWith('Express server stopped successfully');
    expect(server.isListening()).toBe(false);
  });

  test('should handle errors during shutdown gracefully', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    // Mock the server.close method to simulate an error
    const originalClose = server['server'].close;
    server['server'].close = jest.fn((callback: (error?: Error) => void) => {
      callback(new Error('Shutdown error'));
    });

    // Shutdown should reject with the error
    await expect(server.stop()).rejects.toThrow('Shutdown error');

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error stopping server',
      expect.objectContaining({
        error: 'Shutdown error'
      })
    );

    // Restore original method for cleanup
    server['server'].close = originalClose;
  });

  test('should handle repeated shutdown calls', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    // First shutdown should work normally
    await expect(server.stop()).resolves.toBeUndefined();
    expect(server.isListening()).toBe(false);

    // Clear the logs from first shutdown
    mockLogger.warn.mockClear();

    // Second shutdown should be handled gracefully
    await expect(server.stop()).resolves.toBeUndefined();

    // Should log warning about stopping non-running server
    expect(mockLogger.warn).toHaveBeenCalledWith('Attempted to stop server that is not running');
  });

  test('should preserve server state during shutdown process', async () => {
    const config = { port: 0, host: '127.0.0.1', environment: 'test' };
    server = createServer(config);
    await server.start();

    // Verify initial state
    expect(server.getConfig()).toEqual(expect.objectContaining(config));
    const app = server.getApp();
    expect(app).toBeDefined();

    // Start shutdown
    const shutdownPromise = server.stop();

    // During shutdown, config and app should still be available
    expect(server.getConfig()).toEqual(expect.objectContaining(config));
    expect(server.getApp()).toBe(app);

    await shutdownPromise;

    // After shutdown, config and app should still be available
    expect(server.getConfig()).toEqual(expect.objectContaining(config));
    expect(server.getApp()).toBe(app);
    expect(server.isListening()).toBe(false);
  });
});