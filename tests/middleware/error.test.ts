import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  HttpError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  formatErrorResponse,
  asyncHandler,
  notFoundHandler,
  validateRequired,
  validateEmail,
  validateLength
} from '../../src/middleware/error';

// Mock express request and response objects
const mockRequest = (): Partial<Request> => ({
  url: '/test',
  originalUrl: '/test',
  method: 'GET',
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-user-agent')
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    headersSent: false
  };
  return res;
};

const mockNext = (): NextFunction => jest.fn();

describe('Error Middleware', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('should handle uncaught errors gracefully with error middleware', () => {
    it('should handle uncaught errors gracefully with error middleware', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Given an uncaught error occurs
      const testError = new Error('Test uncaught error');

      // When the error handler middleware processes it
      errorHandler(testError, req, res, next);

      // Then the server handles it gracefully
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test uncaught error',
        timestamp: expect.any(String),
        code: 'INTERNAL_SERVER_ERROR'
      });

      // Verify next is not called since we handled the error
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors with custom status codes', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Given a custom HTTP error occurs
      const httpError = new HttpError(400, 'Bad request error', 'BAD_REQUEST');

      // When the error handler processes it
      errorHandler(httpError, req, res, next);

      // Then it handles it gracefully with the correct status
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request error',
        timestamp: expect.any(String),
        code: 'BAD_REQUEST'
      });
    });

    it('should handle validation errors with field details', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Given a validation error occurs
      const validationError = new ValidationError('email', 'invalid-email', ['invalid email format']);

      // When the error handler processes it
      errorHandler(validationError, req, res, next);

      // Then it handles it gracefully with validation details
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Validation failed for field 'email'",
        timestamp: expect.any(String),
        code: 'VALIDATION_ERROR',
        details: {
          field: 'email',
          value: 'invalid-email',
          constraints: ['invalid email format']
        }
      });
    });

    it('should delegate to express default handler when headers already sent', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Given headers are already sent
      (res as any).headersSent = true;
      const testError = new Error('Test error');

      // When the error handler processes it
      errorHandler(testError, req, res, next);

      // Then it delegates to default express handler
      expect(next).toHaveBeenCalledWith(testError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should mask internal server errors in production', () => {
      // Mock the config module for this test
      const { config } = require('../../src/config');
      const originalEnvironment = config.environment;
      config.environment = 'production';

      try {
        const req = mockRequest() as Request;
        const res = mockResponse() as Response;
        const next = mockNext();

        // Given an internal error occurs in production
        const internalError = new Error('Sensitive internal error');

        // When the error handler processes it
        errorHandler(internalError, req, res, next);

        // Then it masks the error message
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error',
          timestamp: expect.any(String),
          code: 'INTERNAL_SERVER_ERROR'
        });
      } finally {
        config.environment = originalEnvironment;
      }
    });
  });

  describe('Error Types', () => {
    it('should create HttpError with proper properties', () => {
      const error = new HttpError(404, 'Not found', 'NOT_FOUND', { resource: 'user' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ resource: 'user' });
      expect(error.name).toBe('HttpError');
    });

    it('should create NotFoundError with proper defaults', () => {
      const error = new NotFoundError('User');

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create UnauthorizedError with proper defaults', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(HttpError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized access');
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Async Handler', () => {
    it('should catch errors from async functions', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Create an async function that throws
      const asyncFunction = async (req: Request, res: Response, next: NextFunction) => {
        throw new Error('Async error');
      };

      const wrappedFunction = asyncHandler(asyncFunction);

      // When the wrapped function is called
      await wrappedFunction(req, res, next);

      // Then the error is passed to next
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Async error'
      }));
    });

    it('should handle successful async functions', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Create a successful async function
      const asyncFunction = async (req: Request, res: Response, next: NextFunction) => {
        (res as any).send('success');
      };

      const wrappedFunction = asyncHandler(asyncFunction);

      // When the wrapped function is called
      await wrappedFunction(req, res, next);

      // Then no error is passed to next
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Not Found Handler', () => {
    it('should create NotFoundError for unmatched routes', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // When the not found handler is called
      notFoundHandler(req, res, next);

      // Then it creates a NotFoundError
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Route GET /test not found'
      }));
    });
  });

  describe('Validation Helpers', () => {
    it('should validate required fields', () => {
      expect(() => validateRequired('value', 'field')).not.toThrow();
      expect(() => validateRequired(null, 'field')).toThrow(ValidationError);
      expect(() => validateRequired(undefined, 'field')).toThrow(ValidationError);
      expect(() => validateRequired('', 'field')).toThrow(ValidationError);
    });

    it('should validate email format', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow();
      expect(() => validateEmail('invalid-email')).toThrow(ValidationError);
      expect(() => validateEmail('test@')).toThrow(ValidationError);
    });

    it('should validate string length', () => {
      expect(() => validateLength('hello', 'field', 3, 10)).not.toThrow();
      expect(() => validateLength('hi', 'field', 3, 10)).toThrow(ValidationError);
      expect(() => validateLength('this is too long', 'field', 3, 10)).toThrow(ValidationError);
    });
  });

  describe('Error Response Formatting', () => {
    it('should format error responses correctly', () => {
      const error = new HttpError(400, 'Bad request', 'BAD_REQUEST');
      const response = formatErrorResponse(error);

      expect(response).toEqual({
        success: false,
        error: 'Bad request',
        timestamp: expect.any(String),
        code: 'BAD_REQUEST'
      });
    });

    it('should include stack trace in development', () => {
      // Mock the config module for this test
      const { config } = require('../../src/config');
      const originalEnvironment = config.environment;
      config.environment = 'development';

      try {
        const error = new Error('Test error');
        const response = formatErrorResponse(error, true);

        expect(response).toHaveProperty('stack');
        expect((response as any).stack).toContain('Test error');
      } finally {
        config.environment = originalEnvironment;
      }
    });
  });
});