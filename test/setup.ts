import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Test Environment Configuration
beforeAll(async () => {
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['LOG_LEVEL'] = 'error'; // Reduce log noise in tests
  process.env['PORT'] = '0'; // Use random available port for tests

  // Suppress console output during tests unless explicitly needed
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: originalConsole.error, // Keep errors visible
  };
});

afterAll(async () => {
  // Global cleanup after all tests
  // Restore environment if needed
  delete process.env['LOG_LEVEL'];
  delete process.env['PORT'];
});

beforeEach(() => {
  // Clear all mocks before each test for clean state
  jest.clearAllMocks();

  // Reset any module mocks to ensure test isolation
  jest.resetModules();
});

afterEach(() => {
  // Clean up any test-specific state
  jest.restoreAllMocks();
});

// Configure global test timeouts
jest.setTimeout(30000);

// Test Utilities
export const TestUtils = {
  /**
   * Wait for a specified number of milliseconds
   */
  wait: (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate a random port number for testing
   */
  getRandomPort: (): number =>
    Math.floor(Math.random() * (65535 - 1024) + 1024),

  /**
   * Create a test server configuration
   */
  createTestServerConfig: () => ({
    port: 0, // Let system assign available port
    host: '127.0.0.1',
    environment: 'test'
  }),

  /**
   * Mock environment variables for a test
   */
  mockEnv: (envVars: Record<string, string>): (() => void) => {
    const originalEnv = { ...process.env };

    // Set mock environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Return cleanup function
    return () => {
      process.env = originalEnv;
    };
  },

  /**
   * Silence console output for a specific test
   */
  silenceConsole: (): (() => void) => {
    const originalConsole = global.console;
    global.console = {
      ...originalConsole,
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    return () => {
      global.console = originalConsole;
    };
  },

  /**
   * Wait for a condition to be true with timeout
   */
  waitFor: async (
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await TestUtils.wait(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms timeout`);
  }
};

// Export test utilities for use in test files
export default TestUtils;