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