import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, AppError } from '../../src/middleware/error.js';
import Logger from '../../src/utils/logger.js';

// Mock Logger
jest.mock('../../src/utils/logger.js');
const mockLogger = Logger as jest.Mocked<typeof Logger>;

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      get: jest.fn(),
      ip: '127.0.0.1'
    };

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });

    mockResponse = {
      status: statusSpy as any,
      json: jsonSpy as any
    };

    nextFunction = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    test('should return proper error response when error occurs', () => {
      const testError: AppError = new Error('Test error message');
      testError.statusCode = 400;

      errorHandler(
        testError,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Verify proper error response is returned
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error message',
          statusCode: 400
        }
      });

      // Verify error is logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request error occurred',
        expect.objectContaining({
          error: 'Test error message',
          statusCode: 400,
          method: 'GET',
          url: '/test'
        })
      );
    });

    test('should handle errors without statusCode', () => {
      const testError: AppError = new Error('Generic error');

      errorHandler(
        testError,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Generic error',
          statusCode: 500
        }
      });
    });

    test('should include stack trace in development environment', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const testError: AppError = new Error('Test error with stack');
      testError.stack = 'Error stack trace here';

      errorHandler(
        testError,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error with stack',
          statusCode: 500,
          stack: 'Error stack trace here'
        }
      });

      // Restore original environment
      process.env['NODE_ENV'] = originalEnv;
    });

    test('should log request details with error', () => {
      const testError: AppError = new Error('Detailed error');
      testError.statusCode = 422;

      (mockRequest.get as jest.Mock).mockReturnValue('TestUserAgent');

      errorHandler(
        testError,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Request error occurred',
        {
          error: 'Detailed error',
          statusCode: 422,
          method: 'GET',
          url: '/test',
          stack: testError.stack,
          userAgent: 'TestUserAgent',
          ip: '127.0.0.1'
        }
      );
    });
  });

  describe('notFoundHandler', () => {
    test('should create 404 error for unknown routes', () => {
      mockRequest.originalUrl = '/unknown-route';

      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not Found - /unknown-route',
          statusCode: 404
        })
      );
    });
  });
});