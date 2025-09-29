import express from 'express';
import request from 'supertest';

describe('Health Route', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
  });

  it('should return 200 OK status for GET /health endpoint', async () => {
    // We'll import and setup the health route
    const { healthRouter } = await import('../../src/routes/health');
    app.use(healthRouter);

    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok'
      })
    );
  });
});