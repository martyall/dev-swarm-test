import { Server } from '../src/server';

describe('Server', () => {
  let server: Server;
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    originalEnv = { ...process.env };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    if (server) {
      // Clean up any server instance
    }
  });

  describe('Port Configuration', () => {
    it('should start server on PORT environment variable when set', () => {
      process.env.PORT = '8080';
      server = new Server();

      expect(server.getPort()).toBe(8080);
    });

    it('should default to port 3000 when PORT environment variable not set', () => {
      delete process.env.PORT;
      server = new Server();

      expect(server.getPort()).toBe(3000);
    });

    it('should default to port 3000 when PORT environment variable is invalid', () => {
      process.env.PORT = 'invalid';
      server = new Server();

      expect(server.getPort()).toBe(3000);
    });

    it('should default to port 3000 when PORT environment variable is negative', () => {
      process.env.PORT = '-1';
      server = new Server();

      expect(server.getPort()).toBe(3000);
    });
  });

  describe('Server Startup', () => {
    it('should log startup message with port number', async () => {
      process.env.PORT = '3001';
      server = new Server();

      // Mock the listen method to avoid actually starting the server
      const mockListen = jest.fn((port, callback) => {
        if (callback) callback();
        return {
          close: jest.fn((cb) => cb && cb())
        };
      });

      jest.spyOn(server.getApp(), 'listen').mockImplementation(mockListen);

      await server.start();

      expect(consoleLogSpy).toHaveBeenCalledWith('Server is listening on port 3001');
    });
  });
});