import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const logger = Logger.getInstance();
  const startTime = Date.now();

  logger.info('Request received', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  const originalNext = next;
  const wrappedNext = (error?: any) => {
    if (error) {
      const duration = Date.now() - startTime;
      logger.error('Request failed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
    }
    originalNext(error);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  wrappedNext();
}