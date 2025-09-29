import { Request, Response, NextFunction } from 'express';
import { loggingMiddleware } from '../../src/middleware/logging.middleware';
import { Logger } from '../../src/utils/logger';

jest.mock('../../src/utils/logger');

describe('Logging Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockLogger: jest.Mocked<any>;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'test-agent'
      },
      ip: '127.0.0.1'
    };
    res = {
      statusCode: 200,
      on: jest.fn()
    };
    next = jest.fn();

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    (Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('should log request details including method, URL, and timing', () => {
    it('should log request details including method, URL, and timing', (done) => {
      const mockFinish = jest.fn(() => {
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Request completed',
          expect.objectContaining({
            method: 'GET',
            url: '/test',
            statusCode: 200,
            duration: expect.stringMatching(/\d+ms/)
          })
        );
        done();
      });

      res.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 10); // Simulate some request processing time
        }
      });

      loggingMiddleware(req as Request, res as Response, next);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request received',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          userAgent: 'test-agent',
          ip: '127.0.0.1'
        })
      );

      mockFinish();
    });
  });

  describe('should log error details with error level when request fails', () => {
    it('should log error details with error level when request fails', () => {
      const error = new Error('Test error');
      const errorNext: NextFunction = jest.fn((err) => {
        expect(err).toBe(error);
      });

      req.url = '/error';
      res.statusCode = 500;

      loggingMiddleware(req as Request, res as Response, errorNext);

      errorNext(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Request failed'),
        expect.objectContaining({
          method: 'GET',
          url: '/error',
          statusCode: 500,
          error: expect.objectContaining({
            message: 'Test error',
            stack: expect.any(String)
          })
        })
      );
    });
  });
});