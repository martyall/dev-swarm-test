import { Server } from 'http';
import { createServer } from '../../src/server';

describe('Server Shutdown', () => {
  let server: Server;
  let originalProcessOn: typeof process.on;
  let originalProcessExit: typeof process.exit;

  beforeEach(() => {
    // Mock process.on and process.exit
    originalProcessOn = process.on;
    originalProcessExit = process.exit;

    process.on = jest.fn();
    process.exit = jest.fn();
  });

  afterEach(async () => {
    // Restore original functions
    process.on = originalProcessOn;
    process.exit = originalProcessExit;

    // Close server if it exists
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('should handle graceful shutdown on SIGTERM and SIGINT signals', async () => {
    // Create server instance
    server = createServer();

    // Start the server on a test port
    const port = 3001;
    await new Promise<void>((resolve) => {
      server.listen(port, () => resolve());
    });

    // Verify the server is listening
    expect(server.listening).toBe(true);

    // Verify that signal handlers are registered
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));

    // Get the signal handler functions
    const processOnMock = process.on as jest.Mock;
    let sigtermHandler: Function | undefined;
    let sigintHandler: Function | undefined;

    processOnMock.mock.calls.forEach(([signal, handler]) => {
      if (signal === 'SIGTERM') {
        sigtermHandler = handler;
      } else if (signal === 'SIGINT') {
        sigintHandler = handler;
      }
    });

    expect(sigtermHandler).toBeDefined();
    expect(sigintHandler).toBeDefined();

    // Mock server.close to track if it's called
    const originalClose = server.close;
    const closeMock = jest.fn((callback?: () => void) => {
      if (callback) callback();
      return server;
    });
    server.close = closeMock;

    // Trigger SIGTERM handler
    if (sigtermHandler) {
      sigtermHandler();
    }

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify graceful shutdown was initiated
    expect(closeMock).toHaveBeenCalled();

    // Restore server.close for cleanup
    server.close = originalClose;
  });
});