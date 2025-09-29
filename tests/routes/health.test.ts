import { Request, Response, NextFunction } from 'express';
import {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
  performHealthCheck
} from '../../src/routes/health';

// Mock express request and response objects
const mockRequest = (): Partial<Request> => ({
  url: '/health',
  method: 'GET',
  ip: '127.0.0.1'
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res;
};

const mockNext = (): NextFunction => jest.fn();

describe('Health Check Routes', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('should return 200 OK with status information for GET /health', () => {
    it('should return 200 OK with status information for GET /health', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Given the server is running
      expect(process.uptime()).toBeGreaterThan(0);

      // When GET /health is called
      await healthCheck(req, res, next);

      // Then return 200 OK with status information
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'healthy',
          uptime: expect.any(Number),
          timestamp: expect.any(String),
          version: expect.any(String),
          environment: expect.any(String)
        },
        timestamp: expect.any(String)
      });

      // Verify the data contains the expected status information
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.data.status).toBe('healthy');
      expect(jsonCall.data.uptime).toBeGreaterThan(0);
      expect(jsonCall.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(typeof jsonCall.data.version).toBe('string');
      expect(typeof jsonCall.data.environment).toBe('string');

      // Verify next was not called (no error occurred)
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle health check errors gracefully', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Mock process.uptime to throw an error
      const originalUptime = process.uptime;
      process.uptime = jest.fn().mockImplementation(() => {
        throw new Error('System error');
      });

      try {
        // When health check encounters an error
        await healthCheck(req, res, next);

        // Then it should return 503 with error information
        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Health check failed',
          timestamp: expect.any(String)
        });
      } finally {
        // Restore original function
        process.uptime = originalUptime;
      }
    });

    it('should return consistent timestamp format', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      await healthCheck(req, res, next);

      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      const timestamp = jsonCall.data.timestamp;

      // Verify timestamp is valid ISO string
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should include version information', async () => {
      const originalVersion = process.env['npm_package_version'];
      process.env['npm_package_version'] = '2.0.0';

      try {
        const req = mockRequest() as Request;
        const res = mockResponse() as Response;
        const next = mockNext();

        await healthCheck(req, res, next);

        const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
        expect(jsonCall.data.version).toBe('2.0.0');
      } finally {
        if (originalVersion) {
          process.env['npm_package_version'] = originalVersion;
        } else {
          delete process.env['npm_package_version'];
        }
      }
    });
  });

  describe('Detailed Health Check', () => {
    it('should return detailed health information', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      await detailedHealthCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          uptime: expect.any(Number),
          timestamp: expect.any(String),
          version: expect.any(String),
          environment: expect.any(String),
          memory: expect.objectContaining({
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number)
          }),
          process: expect.objectContaining({
            pid: expect.any(Number),
            platform: expect.any(String),
            nodeVersion: expect.any(String)
          }),
          checks: expect.any(Object)
        }),
        timestamp: expect.any(String)
      });
    });

    it('should return healthy status by default', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      await detailedHealthCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'healthy'
        })
      }));
    });
  });

  describe('Readiness Check', () => {
    it('should return ready status', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      await readinessCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'ready',
          timestamp: expect.any(String)
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Liveness Check', () => {
    it('should return alive status', async () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      await livenessCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'alive',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Perform Health Check Function', () => {
    it('should return comprehensive health status', async () => {
      const healthStatus = await performHealthCheck();

      expect(healthStatus).toMatchObject({
        status: 'healthy',
        checks: expect.any(Object),
        uptime: expect.any(Number),
        timestamp: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
        memory: {
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        },
        process: {
          pid: expect.any(Number),
          platform: expect.any(String),
          nodeVersion: expect.any(String)
        }
      });

      expect(healthStatus.uptime).toBeGreaterThan(0);
      expect(healthStatus.memory?.percentage).toBeLessThanOrEqual(100);
      expect(healthStatus.process?.pid).toBe(process.pid);
    });

    it('should include system check', async () => {
      const healthStatus = await performHealthCheck();

      expect(healthStatus.checks['system']).toMatchObject({
        status: 'up',
        responseTime: expect.any(Number)
      });

      expect(healthStatus.checks['system']?.responseTime).toBeGreaterThanOrEqual(0);
    });
  });
});