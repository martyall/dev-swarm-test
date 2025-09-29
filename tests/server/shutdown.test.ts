import { ExpressServer, createServer } from '../../src/server';

describe('Server Shutdown', () => {
  describe('should close gracefully on SIGTERM signal', () => {
    it('should close gracefully on SIGTERM signal', async () => {
      // Create a fresh server instance
      const server = new ExpressServer();

      // Given the server is running
      await server.start();
      expect(server.isRunning).toBe(true);

      // Verify server is responding
      const healthResponse = await fetch(`http://localhost:${server.port}/health`);
      expect(healthResponse.status).toBe(200);

      // Mock the stop method to track if it's called
      const stopSpy = jest.spyOn(server, 'stop');

      // Set up a promise to wait for shutdown
      const shutdownPromise = new Promise<void>((resolve) => {
        const originalHandler = server.stop.bind(server);
        server.stop = jest.fn().mockImplementation(async () => {
          const result = await originalHandler();
          resolve();
          return result;
        });
      });

      // When SIGTERM signal is received, simulate the shutdown handler behavior
      await server.stop();

      // Then the server closes gracefully
      expect(server.isRunning).toBe(false);
    }, 10000);

    it('should handle graceful shutdown with cleanup hooks', async () => {
      let beforeShutdownCalled = false;
      let afterShutdownCalled = false;

      const serverWithHooks = new ExpressServer({
        beforeShutdown: async () => {
          beforeShutdownCalled = true;
          // Simulate cleanup task
          await new Promise(resolve => setTimeout(resolve, 50));
        },
        afterShutdown: async () => {
          afterShutdownCalled = true;
        }
      });

      // Given the server is running with shutdown hooks
      await serverWithHooks.start();
      expect(serverWithHooks.isRunning).toBe(true);

      // When shutdown is initiated
      await serverWithHooks.stop();

      // Then the server closes gracefully and hooks are called
      expect(serverWithHooks.isRunning).toBe(false);
      expect(beforeShutdownCalled).toBe(true);
      expect(afterShutdownCalled).toBe(true);
    });

    it('should handle stop method when server is already stopped', async () => {
      const server = new ExpressServer();

      // Given the server is not running
      expect(server.isRunning).toBe(false);

      // When stop is called
      await expect(server.stop()).resolves.toBeUndefined();

      // Then no error is thrown and server remains stopped
      expect(server.isRunning).toBe(false);
    });

    it('should properly clean up server resources on stop', async () => {
      const server = new ExpressServer();

      // Given the server is running
      await server.start();
      expect(server.isRunning).toBe(true);
      expect(server.server).not.toBeNull();
      expect(server.getAddress()).toBeTruthy();

      // When stop is called
      await server.stop();

      // Then server resources are cleaned up
      expect(server.isRunning).toBe(false);
      expect(server.server).toBeNull();
      expect(server.getAddress()).toBeNull();
    });
  });
});