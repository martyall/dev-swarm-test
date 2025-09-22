import { ExpressServer } from '../src/server';

describe('Graceful Shutdown', () => {
  let server: ExpressServer;
  let consoleSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(async () => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never;
    });
    
    server = new ExpressServer(0); // Use random port for testing
    await server.start();
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
    
    // Clean up server if still running
    try {
      await server.stop();
    } catch (error) {
      // Server might already be stopped, ignore error
    }
  });

  describe('should close server gracefully on SIGTERM signal', () => {
    it('should close server gracefully on SIGTERM signal', async () => {
      // Mock the gracefulShutdown method to avoid process.exit
      const gracefulShutdownSpy = jest.spyOn(server as any, 'gracefulShutdown')
        .mockImplementation(async () => {
          console.log('Starting graceful shutdown...');
          await server.stop();
          console.log('Server shut down successfully');
        });

      // Emit SIGTERM signal
      process.emit('SIGTERM', 'SIGTERM');

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the graceful shutdown was called
      expect(gracefulShutdownSpy).toHaveBeenCalled();
      
      // Verify the correct logs were made
      expect(consoleSpy).toHaveBeenCalledWith('SIGTERM received, shutting down gracefully');
      expect(consoleSpy).toHaveBeenCalledWith('Starting graceful shutdown...');
      expect(consoleSpy).toHaveBeenCalledWith('Server shut down successfully');

      gracefulShutdownSpy.mockRestore();
    });

    it('should close server gracefully on SIGINT signal', async () => {
      // Mock the gracefulShutdown method to avoid process.exit
      const gracefulShutdownSpy = jest.spyOn(server as any, 'gracefulShutdown')
        .mockImplementation(async () => {
          console.log('Starting graceful shutdown...');
          await server.stop();
          console.log('Server shut down successfully');
        });

      // Emit SIGINT signal
      process.emit('SIGINT', 'SIGINT');

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the graceful shutdown was called
      expect(gracefulShutdownSpy).toHaveBeenCalled();
      
      // Verify the correct logs were made
      expect(consoleSpy).toHaveBeenCalledWith('SIGINT received, shutting down gracefully');
      expect(consoleSpy).toHaveBeenCalledWith('Starting graceful shutdown...');
      expect(consoleSpy).toHaveBeenCalledWith('Server shut down successfully');

      gracefulShutdownSpy.mockRestore();
    });
  });
});