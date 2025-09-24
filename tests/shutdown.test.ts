import { Server } from '../src/server';

describe('Server Shutdown', () => {
  let server: Server;
  let originalProcessOn: typeof process.on;
  let processOnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let mockServerInstance: any;

  beforeEach(() => {
    originalProcessOn = process.on;
    processOnSpy = jest.spyOn(process, 'on');
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock server instance
    mockServerInstance = {
      close: jest.fn((callback) => {
        if (callback) callback();
      })
    };
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    process.on = originalProcessOn;
    jest.clearAllMocks();
  });

  describe('Graceful Shutdown', () => {
    it('should shut down gracefully when receiving SIGINT signal', async () => {
      server = new Server();

      // Mock the Express app's listen method to return our mock server
      const mockListen = jest.fn((port, callback) => {
        if (callback) callback();
        return mockServerInstance;
      });

      jest.spyOn(server.getApp(), 'listen').mockImplementation(mockListen);

      // Start the server
      await server.start();

      // Verify that process.on was called with SIGINT and SIGTERM handlers
      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // Get the SIGINT handler
      const sigintHandler = processOnSpy.mock.calls.find(call => call[0] === 'SIGINT')[1];

      // Mock process.exit to prevent actual exit during test
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Execute the SIGINT handler and catch the process.exit
      try {
        sigintHandler();
      } catch (error) {
        expect((error as Error).message).toBe('process.exit called');
      }

      // Verify graceful shutdown behavior
      expect(consoleLogSpy).toHaveBeenCalledWith('Received SIGINT, shutting down gracefully...');
      expect(mockServerInstance.close).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Server closed');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should shut down gracefully when receiving SIGTERM signal', async () => {
      server = new Server();

      // Mock the Express app's listen method to return our mock server
      const mockListen = jest.fn((port, callback) => {
        if (callback) callback();
        return mockServerInstance;
      });

      jest.spyOn(server.getApp(), 'listen').mockImplementation(mockListen);

      // Start the server
      await server.start();

      // Get the SIGTERM handler
      const sigtermHandler = processOnSpy.mock.calls.find(call => call[0] === 'SIGTERM')[1];

      // Mock process.exit to prevent actual exit during test
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Execute the SIGTERM handler and catch the process.exit
      try {
        sigtermHandler();
      } catch (error) {
        expect((error as Error).message).toBe('process.exit called');
      }

      // Verify graceful shutdown behavior
      expect(consoleLogSpy).toHaveBeenCalledWith('Received SIGTERM, shutting down gracefully...');
      expect(mockServerInstance.close).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Server closed');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should register signal handlers during server start', async () => {
      server = new Server();

      // Mock the Express app's listen method
      const mockListen = jest.fn((port, callback) => {
        if (callback) callback();
        return mockServerInstance;
      });

      jest.spyOn(server.getApp(), 'listen').mockImplementation(mockListen);

      // Start the server
      await server.start();

      // Verify that both SIGINT and SIGTERM handlers were registered
      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // Verify the handlers are functions
      const sigintCall = processOnSpy.mock.calls.find(call => call[0] === 'SIGINT');
      const sigtermCall = processOnSpy.mock.calls.find(call => call[0] === 'SIGTERM');

      expect(typeof sigintCall[1]).toBe('function');
      expect(typeof sigtermCall[1]).toBe('function');
    });
  });
});