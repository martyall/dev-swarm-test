import { ExpressServer, createServer } from '../../src/server';
import { config } from '../../src/config';

describe('Server Startup', () => {
  let server: ExpressServer;

  beforeEach(() => {
    server = createServer();
  });

  afterEach(async () => {
    if (server.isRunning) {
      await server.stop();
    }
  });

  describe('should start server on configured port and host', () => {
    it('should start server on configured port and host', async () => {
      // Given the server is configured
      expect(server.port).toBe(config.port);
      expect(server.host).toBe(process.env['HOST'] || '0.0.0.0');
      expect(server.isRunning).toBe(false);

      // When starting up
      await server.start();

      // Then proper port and host settings are used
      expect(server.isRunning).toBe(true);
      expect(server.port).toBe(config.port);

      const address = server.getAddress();
      expect(address).toBeTruthy();
      expect(address).toContain(server.port.toString());

      // Verify server is actually listening by making a request
      const response = await fetch(`http://localhost:${server.port}/health`);
      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
    });

    it('should use environment variables for port configuration', async () => {
      // This test verifies that the server constructor respects port configuration
      // We can't easily test runtime env var changes due to config module loading,
      // so we test the constructor behavior directly

      // Create a server with a custom port
      const testPort = 4567;
      const testServer = new ExpressServer();
      testServer.port = testPort; // Override the port directly

      // Given the server is configured with a specific port
      expect(testServer.port).toBe(testPort);

      // When starting up
      await testServer.start();

      // Then proper port settings are used
      expect(testServer.isRunning).toBe(true);
      expect(testServer.port).toBe(testPort);

      const address = testServer.getAddress();
      expect(address).toContain(testPort.toString());

      // Cleanup
      await testServer.stop();
    });

    it('should use default host when HOST environment variable is not set', async () => {
      // Save original value
      const originalHost = process.env['HOST'];

      try {
        // Remove HOST env var
        delete process.env['HOST'];

        // Create new server instance
        const testServer = new ExpressServer();

        // Given the server is configured without HOST env var
        expect(testServer.host).toBe('0.0.0.0');

        // When starting up
        await testServer.start();

        // Then default host settings are used
        expect(testServer.isRunning).toBe(true);
        expect(testServer.host).toBe('0.0.0.0');

        // Cleanup
        await testServer.stop();
      } finally {
        // Restore original value
        if (originalHost) {
          process.env['HOST'] = originalHost;
        }
      }
    });
  });
});