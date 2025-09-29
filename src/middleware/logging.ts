import morgan from 'morgan';
import { logger } from '../utils/logger';

interface MorganStream {
  write(message: string): void;
}

class TsLogStream implements MorganStream {
  write(message: string): void {
    logger.info('HTTP Request:', message.trim());
  }
}

export const createMorganMiddleware = (format?: string, options?: any) => {
  const tsLogStream = new TsLogStream();

  const morganOptions = {
    stream: tsLogStream,
    ...options
  };

  return morgan(format || 'combined', morganOptions);
};

export const httpLoggingMiddleware = createMorganMiddleware();

export default httpLoggingMiddleware;