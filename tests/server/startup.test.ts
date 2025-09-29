import { createServer, ExpressServer } from '../../src/server.js';
import Logger from '../../src/utils/logger.js';
import request from 'supertest';

// Mock Logger
jest.mock('../../src/utils/logger.js');
const mockLogger = Logger as jest.Mocked<typeof Logger>;

describe('Express Server Startup', () => {
  let server: ExpressServer;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (server && server.isListening()) {
      await server.stop();
    }
  });

  // Required Test 416/test-001
  test('should start Express server on configured port', async () => {
    const testPort = 0; // Use port 0 to let OS assign available port
    const testConfig = {
      port: testPort,
      host: '127.0.0.1',
      environment: 'test'
    };

    server = createServer(testConfig);

    // Verify server starts successfully
    await expect(server.start()).resolves.toBeUndefined();

    // Verify server is listening
    expect(server.isListening()).toBe(true);

    // Verify server config
    const config = server.getConfig();
    expect(config.host).toBe('127.0.0.1');
    expect(config.environment).toBe('test');
    expect(typeof config.port).toBe('number');

    // Verify server address is available
    const address = server.getAddress();
    expect(address).not.toBeNull();
    expect(typeof address).toBe('string');

    // Verify logging was called for successful startup
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Express server started successfully',
      expect.objectContaining({
        port: expect.any(Number),
        host: '127.0.0.1',
        environment: 'test',
        nodeVersion: expect.any(String),
        pid: expect.any(Number)
      })
    );

    // Verify server responds to health check
    const response = await request(server.getApp())
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');

    // Stop the server
    await server.stop();
    expect(server.isListening()).toBe(false);
  });

  test('should use default configuration when no config provided', () => {
    server = createServer();

    const config = server.getConfig();
    expect(config.port).toBe(3000); // Default port
    expect(config.host).toBe('0.0.0.0'); // Default host
    expect(config.environment).toBe('test'); // NODE_ENV should be 'test' during tests
  });

  test('should use environment variables for configuration', () => {
    const originalPort = process.env['PORT'];
    const originalHost = process.env['HOST'];
    const originalNodeEnv = process.env['NODE_ENV'];

    process.env['PORT'] = '8080';
    process.env['HOST'] = '192.168.1.1';
    process.env['NODE_ENV'] = 'production';

    server = createServer();
    const config = server.getConfig();

    expect(config.port).toBe(8080);
    expect(config.host).toBe('192.168.1.1');
    expect(config.environment).toBe('production');

    // Restore original environment variables
    if (originalPort !== undefined) {
      process.env['PORT'] = originalPort;
    } else {
      delete process.env['PORT'];
    }
    if (originalHost !== undefined) {
      process.env['HOST'] = originalHost;
    } else {
      delete process.env['HOST'];
    }
    if (originalNodeEnv !== undefined) {
      process.env['NODE_ENV'] = originalNodeEnv;
    } else {
      delete process.env['NODE_ENV'];
    }
  });

  test('should handle server startup errors gracefully', async () => {
    // Create first server on specific port
    const testPort = 9999;
    server = createServer({ port: testPort, host: '127.0.0.1' });
    await server.start();

    // Try to create second server on same port (should fail)
    const conflictingServer = createServer({ port: testPort, host: '127.0.0.1' });

    await expect(conflictingServer.start()).rejects.toThrow();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Server startup failed',
      expect.objectContaining({
        error: expect.any(String),
        port: testPort,
        host: '127.0.0.1'
      })
    );
  });

  test('should stop server gracefully', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    expect(server.isListening()).toBe(true);

    await server.stop();

    expect(server.isListening()).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith('Express server stopped successfully');
  });

  test('should handle stopping non-running server', async () => {
    server = createServer();

    // Server is not started, so stopping should not throw
    await expect(server.stop()).resolves.toBeUndefined();

    expect(mockLogger.warn).toHaveBeenCalledWith('Attempted to stop server that is not running');
  });

  test('should configure middleware and routes correctly', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });
    await server.start();

    const app = server.getApp();

    // Test that JSON parsing is enabled
    await request(app)
      .post('/health') // Using POST to test JSON parsing
      .send({ test: 'data' })
      .expect(404); // Should get 404 since POST /health doesn't exist

    // Test that health route is configured
    await request(app)
      .get('/health')
      .expect(200);

    // Test that 404 handler is configured
    await request(app)
      .get('/non-existent-route')
      .expect(404);

    // Verify middleware configuration logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Middleware configured',
      expect.objectContaining({
        environment: expect.any(String),
        jsonLimit: '10mb',
        urlencodedLimit: '10mb'
      })
    );

    // Verify routes configuration logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Routes configured',
      expect.objectContaining({
        routes: ['/health'],
        totalRoutes: 1
      })
    );
  });

  test('should return correct address information', async () => {
    server = createServer({ port: 0, host: '127.0.0.1' });

    // Before starting, address should be null
    expect(server.getAddress()).toBeNull();

    await server.start();

    // After starting, address should be available
    const address = server.getAddress();
    expect(address).not.toBeNull();
    expect(typeof address).toBe('string');
    expect(address).toMatch(/127\.0\.0\.1:\d+/);

    await server.stop();

    // After stopping, address should be null again
    expect(server.getAddress()).toBeNull();
  });
});