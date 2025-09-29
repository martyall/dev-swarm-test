import { HealthStatus, HealthCheckResponse, ServiceInfo } from '../../src/types/health.types';

describe('Health Types', () => {
  describe('should return response matching health types interface', () => {
    it('should return response matching health types interface', () => {
      const mockHealthStatus: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 12345,
        version: '1.0.0'
      };

      const mockHealthResponse: HealthCheckResponse = {
        service: 'test-service',
        health: mockHealthStatus,
        checks: {
          database: 'connected',
          cache: 'active'
        }
      };

      const mockServiceInfo: ServiceInfo = {
        name: 'test-service',
        version: '1.0.0',
        environment: 'test'
      };

      // Verify the response matches the interface structure
      expect(mockHealthResponse.service).toBe('test-service');
      expect(mockHealthResponse.health.status).toBe('healthy');
      expect(mockHealthResponse.health.timestamp).toBeDefined();
      expect(mockHealthResponse.health.uptime).toBe(12345);
      expect(mockHealthResponse.health.version).toBe('1.0.0');
      expect(mockHealthResponse.checks).toBeDefined();

      // Verify ServiceInfo interface
      expect(mockServiceInfo.name).toBe('test-service');
      expect(mockServiceInfo.version).toBe('1.0.0');
      expect(mockServiceInfo.environment).toBe('test');

      // Type checks - these will fail at compile time if interfaces don't match
      expect(typeof mockHealthStatus.status).toBe('string');
      expect(typeof mockHealthStatus.timestamp).toBe('string');
      expect(typeof mockHealthStatus.uptime).toBe('number');
    });

    it('should support different health status values', () => {
      const healthyStatus: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 1000
      };

      const degradedStatus: HealthStatus = {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: 2000
      };

      const unhealthyStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: 3000
      };

      expect(healthyStatus.status).toBe('healthy');
      expect(degradedStatus.status).toBe('degraded');
      expect(unhealthyStatus.status).toBe('unhealthy');
    });
  });
});