import express from 'express';
import request from 'supertest';
import { loggingMiddleware } from '../../src/middleware/logging';
import { getLogger } from '../../src/utils/logger';

// Mock the logger to capture calls
jest.mock('../../src/utils/logger');

describe('Logging Middleware', () => {
  let app: express.Application;
  let mockLogger: jest.Mocked<ReturnType<typeof getLogger>>;

  beforeEach(() => {
    app = express();

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    } as any;

    (getLogger as jest.Mock).mockReturnValue(mockLogger);

    // Add logging middleware
    app.use(loggingMiddleware);

    // Add test routes
    app.get('/test', (req, res) => {
      res.json({ message: 'Test response' });
    });

    app.post('/test', express.json(), (req, res) => {
      res.json({ received: req.body });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Logging', () => {
    it('should log request details with correlation ID', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      // Verify that the logger was called
      expect(mockLogger.info).toHaveBeenCalled();

      const logCall = mockLogger.info.mock.calls[0];
      expect(logCall).toBeDefined();
      const message = logCall![0];
      const metadata = logCall![1];

      // Verify log message format
      expect(message).toContain('GET /test');

      // Verify metadata includes correlation ID and request details
      expect(metadata).toEqual(expect.objectContaining({
        correlationId: expect.any(String),
        method: 'GET',
        url: '/test',
        ip: expect.any(String),
        userAgent: expect.any(String),
      }));

      // Verify correlation ID format (should be unique identifier)
      expect(metadata!['correlationId']).toMatch(/^[a-z0-9]{20,}$/);
    });

    it('should generate unique correlation IDs for different requests', async () => {
      const requests = await Promise.all([
        request(app).get('/test'),
        request(app).get('/test'),
        request(app).get('/test'),
      ]);

      requests.forEach(response => expect(response.status).toBe(200));

      expect(mockLogger.info).toHaveBeenCalledTimes(3);

      const correlationIds = mockLogger.info.mock.calls.map(
        call => call![1]!['correlationId']
      );

      // All correlation IDs should be unique
      const uniqueIds = new Set(correlationIds);
      expect(uniqueIds.size).toBe(3);
    });

    it('should log POST requests with body size information', async () => {
      const testBody = { name: 'test', data: { nested: 'value' } };

      await request(app)
        .post('/test')
        .send(testBody)
        .expect(200);

      expect(mockLogger.info).toHaveBeenCalled();

      const logCall = mockLogger.info.mock.calls[0];
      expect(logCall).toBeDefined();
      const message = logCall![0];
      const metadata = logCall![1];

      expect(message).toContain('POST /test');
      expect(metadata).toEqual(expect.objectContaining({
        correlationId: expect.any(String),
        method: 'POST',
        url: '/test',
        contentLength: expect.any(Number),
      }));
    });

    it('should include response time in logs', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/test')
        .expect(200);

      const endTime = Date.now();

      expect(mockLogger.info).toHaveBeenCalled();

      const logCall = mockLogger.info.mock.calls[0];
      expect(logCall).toBeDefined();
      const metadata = logCall![1];

      expect(metadata).toHaveProperty('responseTime');
      expect(metadata!['responseTime']).toBeGreaterThanOrEqual(0);
      expect(metadata!['responseTime']).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });
  });

  describe('Error Logging', () => {
    beforeEach(() => {
      app.get('/error', (req, res, next) => {
        const error = new Error('Test error');
        next(error);
      });

      // Error handler
      app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(500).json({ error: err.message });
      });
    });

    it('should log errors with correlation ID', async () => {
      await request(app)
        .get('/error')
        .expect(500);

      // Should log both the request and potentially the error
      expect(mockLogger.info).toHaveBeenCalled();

      const logCall = mockLogger.info.mock.calls[0];
      expect(logCall).toBeDefined();
      const metadata = logCall![1];

      expect(metadata).toEqual(expect.objectContaining({
        correlationId: expect.any(String),
        method: 'GET',
        url: '/error',
      }));
    });
  });

  describe('Correlation ID Propagation', () => {
    it('should make correlation ID available in request object', async () => {
      let capturedCorrelationId: string | undefined;

      app.get('/correlation-test', (req, res) => {
        capturedCorrelationId = (req as any).correlationId;
        res.json({ correlationId: capturedCorrelationId });
      });

      const response = await request(app)
        .get('/correlation-test')
        .expect(200);

      // Verify correlation ID is available in route handler
      expect(capturedCorrelationId).toBeTruthy();
      expect(typeof capturedCorrelationId).toBe('string');

      // Verify it matches what was logged
      const logCall = mockLogger.info.mock.calls[0];
      expect(logCall).toBeDefined();
      const loggedCorrelationId = logCall![1]!['correlationId'];
      expect(capturedCorrelationId).toBe(loggedCorrelationId);
    });
  });
});