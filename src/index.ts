import { Application } from './app/Application';
import { Logger } from './utils/logger';

const logger = new Logger('Main');

async function main(): Promise<void> {
  try {
    logger.info('Starting application...');

    const app = new Application();
    await app.start();

    logger.info('Application started successfully');
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  main();
}