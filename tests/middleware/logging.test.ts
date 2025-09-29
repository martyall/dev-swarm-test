import express, { Express } from 'express';
import request from 'supertest';
import {
  requestIdMiddleware,
  createMorganStream,
  customLoggerMiddleware,
  loggingMiddleware,
  RequestWithId
} from '../../src/middleware/logging.js';
import Logger from '../../src/utils/logger.js';

// Mock Logger
jest.mock('../../src/utils/logger.js');
const mockLogger = Logger as jest.Mocked<typeof Logger>;

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-12345')
}));

describe('Logging Middleware', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    jest.clearAllMocks();
  });

  afterEach(() => {
    Logger.clearCorrelationId();
  });

  describe('requestIdMiddleware', () => {
    test('should add request ID and set correlation ID', () => {
      const req: Partial<RequestWithId> = {};
      const res = {} as express.Response;
      const next = jest.fn();

      requestIdMiddleware(
        req as RequestWithId,
        res,
        next
      );

      expect(req.id).toBe('test-uuid-12345');
      expect(mockLogger.setCorrelationId).toHaveBeenCalledWith('test-uuid-12345');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('createMorganStream', () => {
    test('should write messages to logger', () => {
      const stream = createMorganStream();

      stream.write('GET /test 200 15ms - 1024 bytes\n');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'GET /test 200 15ms - 1024 bytes',
        {
          source: 'morgan',
          type: 'http_request'
        }
      );
    });

    test('should not log empty messages', () => {
      const stream = createMorganStream();

      stream.write('   \n');

      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('customLoggerMiddleware', () => {
    test('should log request start and completion', (done) => {
      const req: Partial<RequestWithId> = {
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1',
        id: 'test-request-id',
        get: jest.fn().mockReturnValue('TestUserAgent')
      };

      const res = {
        get: jest.fn().mockReturnValue('1024'),
        statusCode: 200,
        on: jest.fn()
      } as any;

      const next = jest.fn();

      // Capture the finish callback
      let finishCallback: () => void;
      res.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      });

      customLoggerMiddleware(
        req as RequestWithId,
        res,
        next
      );

      // Verify request start is logged
      expect(mockLogger.info).toHaveBeenCalledWith(
        'HTTP Request Started',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
          userAgent: 'TestUserAgent',
          requestId: 'test-request-id'
        })
      );

      expect(next).toHaveBeenCalled();

      // Simulate response finish
      setTimeout(() => {
        finishCallback!();

        // Verify request completion is logged
        expect(mockLogger.info).toHaveBeenCalledWith(
          'HTTP Request Completed',
          expect.objectContaining({
            method: 'GET',
            url: '/test',
            ip: '127.0.0.1',
            userAgent: 'TestUserAgent',
            statusCode: 200,
            contentLength: '1024',
            requestId: 'test-request-id',
            duration: expect.any(Number)
          })
        );

        done();
      }, 10);
    });
  });

  describe('integrated logging middleware', () => {
    // Required Test 416/test-004
    test('should log HTTP requests through middleware', async () => {
      // Set up express app with logging middleware
      app.use(loggingMiddleware);

      // Add a simple test route
      app.get('/test', (_req, res) => {
        res.status(200).json({ message: 'test response' });
      });

      // Make a request through the middleware
      const response = await request(app)
        .get('/test')
        .expect(200);

      // Verify appropriate logs are generated
      // Check that Logger.info was called for request started
      expect(mockLogger.info).toHaveBeenCalledWith(
        'HTTP Request Started',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          requestId: 'test-uuid-12345'
        })
      );

      // Check that Logger.info was called for HTTP request completed
      expect(mockLogger.info).toHaveBeenCalledWith(
        'HTTP Request Completed',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          statusCode: 200,
          requestId: 'test-uuid-12345'
        })
      );

      // Check that correlation ID was set
      expect(mockLogger.setCorrelationId).toHaveBeenCalledWith('test-uuid-12345');

      // Verify response
      expect(response.body).toEqual({ message: 'test response' });
    });

    test('should handle POST requests with different status codes', async () => {
      app.use(loggingMiddleware);

      app.post('/create', (_req, res) => {
        res.status(201).json({ id: 123, created: true });
      });

      await request(app)
        .post('/create')
        .send({ data: 'test' })
        .expect(201);

      // Verify POST method is logged correctly
      expect(mockLogger.info).toHaveBeenCalledWith(
        'HTTP Request Started',
        expect.objectContaining({
          method: 'POST',
          url: '/create'
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'HTTP Request Completed',
        expect.objectContaining({
          method: 'POST',
          url: '/create',
          statusCode: 201
        })
      );
    });

    test('should handle requests with missing User-Agent', async () => {
      app.use(loggingMiddleware);

      app.get('/no-agent', (_req, res) => {
        res.status(200).send('OK');
      });

      await request(app)
        .get('/no-agent')
        .set('User-Agent', '') // Remove user agent
        .expect(200);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'HTTP Request Started',
        expect.objectContaining({
          userAgent: 'Unknown'
        })
      );
    });
  });
});