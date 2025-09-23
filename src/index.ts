import { Server } from './server';

async function main() {
  try {
    const server = new Server();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);

  // In production, we might want to gracefully shutdown instead of immediate exit
  if (process.env.NODE_ENV === 'production') {
    console.error('Server shutting down due to unhandled promise rejection...');
    process.exit(1);
  } else {
    console.error('Unhandled promise rejection detected in development mode');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.name);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);

  // Always exit on uncaught exceptions as the process is in an unknown state
  console.error('Server shutting down due to uncaught exception...');
  process.exit(1);
});

// Handle warnings
process.on('warning', (warning) => {
  console.warn('Process Warning:', warning.name);
  console.warn('Message:', warning.message);
  console.warn('Stack:', warning.stack);
});

if (require.main === module) {
  main();
}

export { Server } from './server';