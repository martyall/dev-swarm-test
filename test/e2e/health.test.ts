import { createTestServer, resetTestState } from '../helpers';

describe('Health Check E2E', () => {
  let server: ReturnType<typeof createTestServer>;

  beforeEach(async () => {
    await resetTestState();
    server = createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('GET /health', () => {
    it('should return 200 status for health check endpoint', async () => {
      const response = await server.request
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should return correct health check response body', async () => {
      const response = await server.request
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });

      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return health status', async () => {
      const response = await server.request
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });

      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return consistent status format', async () => {
      const response = await server.request
        .get('/health')
        .expect(200);

      expect(Object.keys(response.body)).toEqual(['status', 'timestamp', 'uptime']);
      expect(response.body.status).toBe('ok');
    });
  });
});