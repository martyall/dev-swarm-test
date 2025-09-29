import { createTestServer, resetTestState, waitForMs, TestServer } from './index';

export interface TestSuiteUtilities {
  server: TestServer;
  reset: () => Promise<void>;
  delay: (ms: number) => Promise<void>;
}

export const setupTestSuite = (): TestSuiteUtilities => {
  const server = createTestServer();

  return {
    server,
    reset: resetTestState,
    delay: waitForMs
  };
};

export const makeHealthCheckRequest = async (server: TestServer) => {
  return server.request
    .get('/health')
    .expect('Content-Type', /json/)
    .expect(200);
};

export { createTestServer, resetTestState, waitForMs };