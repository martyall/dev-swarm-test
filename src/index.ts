import { AppServer } from './server';
import { logger } from './utils/logger';

const server = new AppServer();

server.start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});