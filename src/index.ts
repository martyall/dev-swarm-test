import { createServer } from './server.js';
import Logger from './utils/logger.js';

const startServer = async (): Promise<void> => {
  try {
    Logger.info('Starting Express TypeScript Server...');

    const server = createServer();

    // Setup graceful shutdown
    const shutdown = async (signal: string) => {
      Logger.info(`${signal} received, shutting down gracefully`);

      try {
        await server.stop();
        Logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        Logger.error('Error during graceful shutdown', {
          error: (error as Error).message,
          stack: (error as Error).stack
        });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error: Error) => {
      Logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any) => {
      Logger.error('Unhandled rejection', {
        reason: String(reason),
        stack: reason?.stack
      });
      process.exit(1);
    });

    await server.start();

    Logger.info('Server startup completed successfully', {
      address: server.getAddress(),
      config: server.getConfig()
    });

  } catch (error) {
    Logger.error('Failed to start server', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    process.exit(1);
  }
};

// Start the server
startServer().catch((error) => {
  Logger.error('Unhandled error during server startup', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});