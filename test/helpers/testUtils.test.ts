import { setupTestSuite, createTestServer, resetTestState, makeHealthCheckRequest } from './testUtils';

describe('Test Helpers', () => {
  describe('setupTestSuite', () => {
    it('should provide server setup utility for testing', async () => {
      const testSuite = setupTestSuite();

      expect(testSuite).toBeDefined();
      expect(testSuite.server).toBeDefined();
      expect(testSuite.reset).toBeDefined();
      expect(testSuite.delay).toBeDefined();

      expect(typeof testSuite.server.request).toBe('object');
      expect(typeof testSuite.server.close).toBe('function');
      expect(typeof testSuite.reset).toBe('function');
      expect(typeof testSuite.delay).toBe('function');

      await testSuite.server.close();
    });
  });

  describe('createTestServer', () => {
    it('should create a test server instance', () => {
      const server = createTestServer();

      expect(server).toBeDefined();
      expect(server.request).toBeDefined();
      expect(server.close).toBeDefined();
    });
  });

  describe('resetTestState', () => {
    it('should reset test state without errors', async () => {
      await expect(resetTestState()).resolves.not.toThrow();
    });
  });

  describe('makeHealthCheckRequest', () => {
    it('should make successful health check request', async () => {
      const server = createTestServer();

      const response = await makeHealthCheckRequest(server);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });

      await server.close();
    });
  });
});