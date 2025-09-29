import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { randomUUID } from 'crypto';
import Logger from '../utils/logger.js';

export interface RequestWithId extends Request {
  id?: string;
}

export const requestIdMiddleware = (
  req: RequestWithId,
  _res: Response,
  next: NextFunction
): void => {
  req.id = randomUUID();
  Logger.setCorrelationId(req.id);
  next();
};

export const createMorganStream = () => ({
  write: (message: string) => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      Logger.info(trimmedMessage, {
        source: 'morgan',
        type: 'http_request',
      });
    }
  },
});

export const morganLoggerMiddleware = morgan(
  ':method :url :status :response-time ms - :res[content-length] bytes',
  {
    stream: createMorganStream(),
  }
);

export const customLoggerMiddleware = (
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  Logger.info('HTTP Request Started', {
    method,
    url,
    ip,
    userAgent,
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const contentLength = res.get('Content-Length') || '0';

    Logger.info('HTTP Request Completed', {
      method,
      url,
      ip,
      userAgent,
      statusCode,
      duration,
      contentLength,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

export const loggingMiddleware = [
  requestIdMiddleware,
  morganLoggerMiddleware,
  customLoggerMiddleware,
];

export default loggingMiddleware;
