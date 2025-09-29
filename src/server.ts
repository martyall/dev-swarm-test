import { Server } from 'http';
import app from './app';

const PORT = process.env.PORT || 3000;

export function createServer(): Server {
  const server = new Server(app);

  // Graceful shutdown handler
  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    // Close the server to stop accepting new requests
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }

      console.log('Server closed successfully');

      // Close database connections, cleanup resources, etc.
      // Add any cleanup logic here

      console.log('Graceful shutdown completed');
      process.exit(0);
    });

    // Force shutdown after timeout if graceful shutdown takes too long
    setTimeout(() => {
      console.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000); // 10 second timeout
  };

  // Register signal handlers for graceful shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}

// Start server if this file is run directly
if (require.main === module) {
  const server = createServer();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });

  // Handle server startup errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
}

export default createServer;