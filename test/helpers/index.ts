import request from 'supertest';
import app from '../../src/index';

export interface TestServer {
  request: request.SuperTest<request.Test>;
  close: () => Promise<void>;
}

export const createTestServer = (): TestServer => {
  const testRequest = request(app);

  return {
    request: testRequest,
    close: async () => {
      // Clean up any test resources if needed
    }
  };
};

export const resetTestState = async (): Promise<void> => {
  // Reset any global test state
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

export const waitForMs = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};