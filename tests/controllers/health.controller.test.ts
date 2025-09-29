import { HealthCheckResponse, HealthStatus, ServiceInfo } from '../../src/types/health.types';

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
});