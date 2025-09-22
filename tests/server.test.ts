import { ExpressServer } from '../src/server';

describe('ExpressServer', () => {
  let server: ExpressServer;
  let originalPort: string | undefined;

  beforeEach(() => {
    originalPort = process.env.PORT;
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    // Restore original PORT environment variable
    if (originalPort !== undefined) {
      process.env.PORT = originalPort;
    } else {
      delete process.env.PORT;
    }
  });

  describe('should start server on PORT environment variable when set', () => {
    it('should start server on PORT environment variable when set', async () => {
      // Set PORT environment variable
      process.env.PORT = '4000';
      
      server = new ExpressServer();
      expect(server.getPort()).toBe(4000);
      
      const serverInstance = await server.start();
      expect(serverInstance).toBeDefined();
      expect(server.getPort()).toBe(4000);
    });
  });

  describe('should default to port 3000 when PORT environment variable not set', () => {
    it('should default to port 3000 when PORT environment variable not set', async () => {
      // Ensure PORT environment variable is not set
      delete process.env.PORT;
      
      server = new ExpressServer();
      expect(server.getPort()).toBe(3000);
      
      const serverInstance = await server.start();
      expect(serverInstance).toBeDefined();
      expect(server.getPort()).toBe(3000);
    });
  });

  describe('should log startup message with port number', () => {
    it('should log startup message with port number', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      server = new ExpressServer(5000);
      await server.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('Server is running on port 5000');
      
      consoleSpy.mockRestore();
    });
  });
});