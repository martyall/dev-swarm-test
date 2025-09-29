import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface RequestContext {
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  timestamp: string;
  requestId?: string;
}

export interface ResponseContext {
  statusCode: number;
  contentLength?: string;
  duration: number;
}

export interface LoggingOptions {
  includeBody?: boolean;
  includeHeaders?: boolean;
  includeQuery?: boolean;
  excludePaths?: string[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

const defaultOptions: LoggingOptions = {
  includeBody: false,
  includeHeaders: false,
  includeQuery: true,
  excludePaths: ['/health', '/favicon.ico'],
  logLevel: 'info'
};

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export function shouldLogRequest(req: Request, excludePaths: string[]): boolean {
  return !excludePaths.includes(req.path);
}

export function extractRequestContext(req: Request, _options: LoggingOptions): RequestContext {
  const context: RequestContext = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string || generateRequestId()
  };

  const userAgent = req.get('User-Agent');
  if (userAgent) {
    context.userAgent = userAgent;
  }

  return context;
}

export function extractResponseContext(res: Response, startTime: number): ResponseContext {
  const duration = Date.now() - startTime;

  const context: ResponseContext = {
    statusCode: res.statusCode,
    duration
  };

  const contentLength = res.get('Content-Length');
  if (contentLength) {
    context.contentLength = contentLength;
  }

  return context;
}

export function createRequestLogger(options: LoggingOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    if (!shouldLogRequest(req, config.excludePaths || [])) {
      return next();
    }

    const requestContext = extractRequestContext(req, config);

    req.headers['x-request-id'] = req.headers['x-request-id'] || requestContext.requestId;

    const logContext: Record<string, any> = {
      type: 'http_request',
      request: requestContext
    };

    if (config.includeQuery && Object.keys(req.query).length > 0) {
      logContext['query'] = req.query;
    }

    if (config.includeHeaders) {
      logContext['headers'] = req.headers;
    }

    if (config.includeBody && req.body) {
      logContext['body'] = req.body;
    }

    const logMessage = `${req.method} ${req.originalUrl || req.url}`;

    switch (config.logLevel) {
      case 'debug':
        logger.debug(logMessage, logContext);
        break;
      case 'info':
        logger.info(logMessage, logContext);
        break;
      case 'warn':
        logger.warn(logMessage, logContext);
        break;
      case 'error':
        logger.error(logMessage, logContext);
        break;
      default:
        logger.info(logMessage, logContext);
    }

    const originalEnd = res.end;
    res.end = function(this: Response, chunk?: any, encoding?: any, cb?: any): Response {
      const responseContext = extractResponseContext(res, startTime);

      const responseLogContext: Record<string, any> = {
        type: 'http_response',
        request: {
          method: req.method,
          url: req.originalUrl || req.url,
          requestId: req.headers['x-request-id']
        },
        response: responseContext
      };

      const responseMessage = `${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${responseContext.duration}ms)`;

      if (res.statusCode >= 400) {
        logger.error(responseMessage, responseLogContext);
      } else if (res.statusCode >= 300) {
        logger.warn(responseMessage, responseLogContext);
      } else {
        switch (config.logLevel) {
          case 'debug':
            logger.debug(responseMessage, responseLogContext);
            break;
          case 'info':
            logger.info(responseMessage, responseLogContext);
            break;
          case 'warn':
            logger.warn(responseMessage, responseLogContext);
            break;
          case 'error':
            logger.error(responseMessage, responseLogContext);
            break;
          default:
            logger.info(responseMessage, responseLogContext);
        }
      }

      return originalEnd.call(this, chunk, encoding, cb);
    };

    next();
  };
}

export const requestLogger = createRequestLogger();

export default requestLogger;