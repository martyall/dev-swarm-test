import TestUtils from './setup.js';

describe('Test Setup and Utilities', () => {
  describe('TestUtils', () => {
    it('should provide wait utility', async () => {
      const start = Date.now();
      await TestUtils.wait(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some variance
    });

    it('should generate random ports within valid range', () => {
      const port = TestUtils.getRandomPort();
      expect(port).toBeGreaterThanOrEqual(1024);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should create test server configuration', () => {
      const config = TestUtils.createTestServerConfig();
      expect(config).toEqual({
        port: 0,
        host: '127.0.0.1',
        environment: 'test'
      });
    });

    it('should mock environment variables with cleanup', () => {
      const originalValue = process.env['TEST_VAR'];

      const cleanup = TestUtils.mockEnv({
        'TEST_VAR': 'test-value'
      });

      expect(process.env['TEST_VAR']).toBe('test-value');

      cleanup();
      expect(process.env['TEST_VAR']).toBe(originalValue);
    });

    it('should wait for conditions to be met', async () => {
      let counter = 0;
      const condition = () => {
        counter++;
        return counter >= 3;
      };

      await TestUtils.waitFor(condition, 1000, 50);
      expect(counter).toBeGreaterThanOrEqual(3);
    });

    it('should timeout when condition is never met', async () => {
      const condition = () => false;

      await expect(
        TestUtils.waitFor(condition, 200, 50)
      ).rejects.toThrow('Condition not met within 200ms timeout');
    });
  });

  describe('Environment Setup', () => {
    it('should have test environment configured', () => {
      expect(process.env['NODE_ENV']).toBe('test');
    });

    it('should have log level configured for tests', () => {
      expect(process.env['LOG_LEVEL']).toBe('error');
    });

    it('should have port configured for tests', () => {
      expect(process.env['PORT']).toBe('0');
    });
  });
});