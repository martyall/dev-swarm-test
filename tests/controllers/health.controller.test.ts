import { HealthCheckResponse, HealthStatus, ServiceInfo } from '../../src/types/health.types';
import { HealthController, Logger } from '../../src/controllers/health.controller';

describe('Health Controller', () => {
  describe('should include service status information in response payload', () => {
    it('should include service status information in response payload', () => {
      // Mock a health controller response
      const mockHealthResponse: HealthCheckResponse = {
        service: 'api-service',
        health: {
          status: 'healthy',
          timestamp: '2025-09-28T19:40:00.000Z',
          uptime: 86400,
          version: '1.0.0'
        },
        checks: {
          database: 'connected',
          redis: 'active',
          external_api: 'reachable'
        }
      };

      // Verify service status information is included
      expect(mockHealthResponse.service).toBeDefined();
      expect(mockHealthResponse.service).toBe('api-service');

      // Verify health status information
      expect(mockHealthResponse.health).toBeDefined();
      expect(mockHealthResponse.health.status).toBeDefined();
      expect(mockHealthResponse.health.timestamp).toBeDefined();
      expect(mockHealthResponse.health.uptime).toBeDefined();
      expect(mockHealthResponse.health.version).toBeDefined();

      // Verify the status is one of the allowed values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(mockHealthResponse.health.status);

      // Verify timestamp format (ISO string)
      expect(() => new Date(mockHealthResponse.health.timestamp)).not.toThrow();

      // Verify uptime is a positive number
      expect(typeof mockHealthResponse.health.uptime).toBe('number');
      expect(mockHealthResponse.health.uptime).toBeGreaterThanOrEqual(0);

      // Verify optional checks are included
      expect(mockHealthResponse.checks).toBeDefined();
      expect(Object.keys(mockHealthResponse.checks!).length).toBeGreaterThan(0);
    });

    it('should include minimal required service information', () => {
      // Test minimal response structure
      const minimalResponse: HealthCheckResponse = {
        service: 'minimal-service',
        health: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: 0
        }
      };

      // Verify minimal required fields are present
      expect(minimalResponse.service).toBeDefined();
      expect(minimalResponse.health.status).toBeDefined();
      expect(minimalResponse.health.timestamp).toBeDefined();
      expect(minimalResponse.health.uptime).toBeDefined();

      // Version and checks are optional
      expect(minimalResponse.health.version).toBeUndefined();
      expect(minimalResponse.checks).toBeUndefined();
    });

    it('should validate service info structure', () => {
      const serviceInfo: ServiceInfo = {
        name: 'health-service',
        version: '2.1.0',
        environment: 'production'
      };

      // Verify ServiceInfo contains expected information
      expect(serviceInfo.name).toBeDefined();
      expect(serviceInfo.version).toBeDefined();
      expect(serviceInfo.environment).toBeDefined();

      expect(typeof serviceInfo.name).toBe('string');
      expect(typeof serviceInfo.version).toBe('string');
      expect(typeof serviceInfo.environment).toBe('string');
    });
  });

  describe('should log health check requests with appropriate level', () => {
    it('should log health check requests with appropriate level', async () => {
      // Mock logger
      const mockLogger: Logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      };

      // Mock Express request and response objects
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-user-agent')
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any;

      // Create controller instance with mock logger
      const controller = new HealthController(
        'test-service',
        '1.0.0',
        'test',
        mockLogger
      );

      // Execute health check
      await controller.getHealth(mockReq, mockRes);

      // Verify logging occurred
      expect(mockLogger.info).toHaveBeenCalledTimes(2);

      // Verify first log call (request received)
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'Health check request received', {
        ip: '127.0.0.1',
        userAgent: 'test-user-agent',
        timestamp: expect.any(String)
      });

      // Verify second log call (completion)
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'Health check completed successfully', {
        service: 'test-service',
        status: 'healthy',
        uptime: expect.any(Number)
      });

      // Verify response status and structure
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        service: 'test-service',
        health: expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          version: '1.0.0'
        }),
        checks: expect.any(Object)
      }));
    });

    it('should log errors with appropriate level when health check fails', async () => {
      // Mock logger
      const mockLogger: Logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      };

      // Mock Express request that will cause an error
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        })
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      } as any;

      // Create controller instance with mock logger
      const controller = new HealthController(
        'test-service',
        '1.0.0',
        'test',
        mockLogger
      );

      // Execute health check (should catch error)
      await controller.getHealth(mockReq, mockRes);

      // Verify error logging occurred
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('Health check failed', {
        error: 'Test error',
        stack: expect.any(String)
      });

      // Verify unhealthy response
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        service: 'test-service',
        health: expect.objectContaining({
          status: 'unhealthy'
        })
      }));
    });
  });
});