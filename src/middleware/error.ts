import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';
import { config } from '../config';
import { ApiError, ApiResponseBody } from '../types/api';

const logger = new Logger('ErrorMiddleware');

// Custom error classes
export class HttpError extends Error implements ApiError {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(statusCode: number, message: string, code?: string, details?: any) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    if (code !== undefined) {
      this.code = code;
    }
    if (details !== undefined) {
      this.details = details;
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }
}

export class ValidationError extends HttpError {
  public field: string;
  public value: any;
  public constraints: string[];

  constructor(field: string, value: any, constraints: string[], details?: any) {
    super(400, `Validation failed for field '${field}'`, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.constraints = constraints;
  }
}

export class NotFoundError extends HttpError {
  constructor(resource?: string) {
    super(404, resource ? `${resource} not found` : 'Resource not found', 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized access') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Access forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Resource conflict') {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

// Error response formatter
export function formatErrorResponse(error: Error, includeStack: boolean = false): ApiResponseBody {
  const isHttpError = error instanceof HttpError;
  const statusCode = isHttpError ? error.statusCode : 500;
  const errorCode = isHttpError ? error.code : 'INTERNAL_SERVER_ERROR';

  const response: ApiResponseBody = {
    success: false,
    error: config.environment === 'production' && !isHttpError
      ? 'Internal server error'
      : error.message,
    timestamp: new Date().toISOString()
  };

  // Add error code for API errors
  if (errorCode) {
    (response as any).code = errorCode;
  }

  // Add additional details for validation errors
  if (error instanceof ValidationError) {
    (response as any).details = {
      field: error.field,
      value: error.value,
      constraints: error.constraints
    };
  }

  // Add stack trace in development
  if (includeStack && config.environment !== 'production') {
    (response as any).stack = error.stack;
  }

  return response;
}

// Main error handling middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  const isHttpError = error instanceof HttpError;
  const statusCode = isHttpError ? error.statusCode : 500;

  // Log error details
  if (statusCode >= 500) {
    logger.error('Server error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else if (statusCode >= 400) {
    logger.warn('Client error:', {
      error: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      statusCode
    });
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(error, config.environment === 'development');
  res.status(statusCode).json(errorResponse);
}

// Async error wrapper - wraps async route handlers to catch errors
export function asyncHandler<T extends Request = Request, U extends Response = Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler middleware
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl}`);
  next(error);
}

// Process-level error handlers
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);

    // Attempt graceful shutdown
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);

    // Convert to uncaught exception
    throw reason;
  });

  // Handle warning events
  process.on('warning', (warning: Error) => {
    logger.warn('Node.js warning:', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });
}

// Validation helper functions
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(fieldName, value, ['required']);
  }
}

export function validateEmail(email: string, fieldName: string = 'email'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(fieldName, email, ['invalid email format']);
  }
}

export function validateLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): void {
  const constraints: string[] = [];

  if (min !== undefined && value.length < min) {
    constraints.push(`minimum length ${min}`);
  }

  if (max !== undefined && value.length > max) {
    constraints.push(`maximum length ${max}`);
  }

  if (constraints.length > 0) {
    throw new ValidationError(fieldName, value, constraints);
  }
}

// Export all error types for easy import
export {
  HttpError as ApiError,
  ValidationError as ApiValidationError
};

// Export default error handler
export default errorHandler;