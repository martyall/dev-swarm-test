import { Request, Response, NextFunction } from 'express';
import { getLogger, createCorrelationId, LogMetadata } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
    }
  }
}

const logger = getLogger();

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const correlationId = createCorrelationId();

  // Attach correlation ID and start time to request
  req.correlationId = correlationId;
  req.startTime = startTime;

  // Log the incoming request
  const requestMetadata: LogMetadata = {
    correlationId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
  };

  // Add content length for POST requests
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentLength = req.get('Content-Length');
    if (contentLength) {
      requestMetadata['contentLength'] = parseInt(contentLength, 10);
    }
  }

  logger.info(`${req.method} ${req.url}`, requestMetadata);

  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const responseMetadata: LogMetadata = {
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
    };

    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.url} - ${res.statusCode}`, responseMetadata);
    } else {
      logger.info(`${req.method} ${req.url} - ${res.statusCode}`, responseMetadata);
    }
  });

  next();
}

export default loggingMiddleware;