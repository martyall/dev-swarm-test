import request from 'supertest';
import { Application } from 'express';
import { App } from '../../src/app';

describe('Error Handling', () => {
  let app: Application;

  beforeAll(() => {
    const appInstance = new App();
    app = appInstance.getApp();
  });

  it('should return 404 error for invalid routes', async () => {
    const response = await request(app)
      .get('/nonexistent-route')
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Route GET /nonexistent-route not found',
      timestamp: expect.any(String),
      path: '/nonexistent-route',
      method: 'GET'
    });

    // Verify timestamp is a valid ISO string
    expect(() => new Date(response.body.timestamp)).not.toThrow();
  });

  it('should return 404 error for invalid POST routes', async () => {
    const response = await request(app)
      .post('/invalid-post-route')
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Route POST /invalid-post-route not found',
      timestamp: expect.any(String),
      path: '/invalid-post-route',
      method: 'POST'
    });
  });

  it('should return 404 error for nested invalid routes', async () => {
    const response = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'Route GET /api/v1/nonexistent not found',
      timestamp: expect.any(String),
      path: '/api/v1/nonexistent',
      method: 'GET'
    });
  });
});