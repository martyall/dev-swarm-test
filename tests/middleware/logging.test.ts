import { NextFunction } from 'express';
import {
  createRequestLogger,
  generateRequestId,
  shouldLogRequest,
  extractRequestContext,
  extractResponseContext,
  LoggingOptions
} from '../../src/middleware/logging';
import { logger } from '../../src/utils/logger';

jest.mock('../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn()
  }
}));

const mockedLogger = logger as jest.Mocked<typeof logger>;

describe('HTTP Request Logging Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      method: 'GET',
      url: '/api/test',
      originalUrl: '/api/test',
      path: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
        'x-request-id': 'test-request-id'
      },
      get: jest.fn((headerName: string) => {
        if (headerName === 'User-Agent') return 'test-agent';
        return undefined;
      }),
      query: { param1: 'value1' },
      body: {},
      connection: { remoteAddress: '127.0.0.1' }
    };

    mockResponse = {
      statusCode: 200,
      get: jest.fn((headerName: string) => {
        if (headerName === 'Content-Length') return '1024';
        return undefined;
      }),
      end: jest.fn()
    };

    nextFunction = jest.fn();
  });

  describe('Request Context Extraction', () => {
    it('should log HTTP request details with proper context information', () => {
      const middleware = createRequestLogger({
        logLevel: 'info',
        includeQuery: true,
        includeHeaders: false
      });

      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime);
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');

      middleware(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'GET /api/test',
        expect.objectContaining({
          type: 'http_request',
          request: expect.objectContaining({
            method: 'GET',
            url: '/api/test',
            ip: '127.0.0.1',
            timestamp: '2024-01-01T00:00:00.000Z',
            requestId: 'test-request-id',
            userAgent: 'test-agent'
          }),
          query: { param1: 'value1' }
        })
      );

      jest.restoreAllMocks();
    });
  });

  describe('Response Logging', () => {
    it('should log response details when request completes', () => {
      const middleware = createRequestLogger({ logLevel: 'info' });

      const startTime = Date.now();
      const endTime = startTime + 150;

      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      middleware(mockRequest, mockResponse, nextFunction);

      const originalEnd = mockResponse.end as jest.Mock;
      originalEnd();

      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test - 200 (150ms)'),
        expect.objectContaining({
          type: 'http_response',
          request: expect.objectContaining({
            method: 'GET',
            url: '/api/test',
            requestId: 'test-request-id'
          }),
          response: expect.objectContaining({
            statusCode: 200,
            duration: 150,
            contentLength: '1024'
          })
        })
      );

      jest.restoreAllMocks();
    });

    it('should log errors for 4xx and 5xx status codes', () => {
      mockResponse.statusCode = 404;
      const middleware = createRequestLogger({ logLevel: 'info' });

      const startTime = Date.now();
      const endTime = startTime + 50;

      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      middleware(mockRequest, mockResponse, nextFunction);

      const originalEnd = mockResponse.end as jest.Mock;
      originalEnd();

      expect(mockedLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test - 404 (50ms)'),
        expect.objectContaining({
          type: 'http_response'
        })
      );

      jest.restoreAllMocks();
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(10);
    });

    it('should properly filter excluded paths', () => {
      const excludePaths = ['/health', '/favicon.ico'];

      mockRequest.path = '/health';
      expect(shouldLogRequest(mockRequest, excludePaths)).toBe(false);

      mockRequest.path = '/api/test';
      expect(shouldLogRequest(mockRequest, excludePaths)).toBe(true);
    });

    it('should extract request context correctly', () => {
      const options: LoggingOptions = { includeQuery: true };
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');

      const context = extractRequestContext(mockRequest, options);

      expect(context).toEqual({
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        timestamp: '2024-01-01T00:00:00.000Z',
        requestId: 'test-request-id',
        userAgent: 'test-agent'
      });

      jest.restoreAllMocks();
    });

    it('should extract response context correctly', () => {
      const startTime = Date.now() - 100;
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 100);

      const context = extractResponseContext(mockResponse, startTime);

      expect(context).toEqual({
        statusCode: 200,
        duration: 100,
        contentLength: '1024'
      });

      jest.restoreAllMocks();
    });
  });

  describe('Configuration Options', () => {
    it('should respect includeHeaders option', () => {
      const middleware = createRequestLogger({
        includeHeaders: true,
        logLevel: 'info'
      });

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: mockRequest.headers
        })
      );
    });

    it('should respect includeBody option', () => {
      mockRequest.body = { test: 'data' };
      const middleware = createRequestLogger({
        includeBody: true,
        logLevel: 'info'
      });

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: { test: 'data' }
        })
      );
    });

    it('should skip logging for excluded paths', () => {
      mockRequest.path = '/health';
      const middleware = createRequestLogger({
        excludePaths: ['/health'],
        logLevel: 'info'
      });

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockedLogger.info).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should use different log levels based on configuration', () => {
      const middleware = createRequestLogger({ logLevel: 'debug' });

      middleware(mockRequest, mockResponse, nextFunction);

      expect(mockedLogger.debug).toHaveBeenCalled();
      expect(mockedLogger.info).not.toHaveBeenCalled();
    });
  });
});