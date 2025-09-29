import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

beforeAll(async () => {
  // Global setup for all tests
  process.env['NODE_ENV'] = 'test';
});

afterAll(async () => {
  // Global cleanup after all tests
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
});

// Configure global test timeouts
jest.setTimeout(30000);