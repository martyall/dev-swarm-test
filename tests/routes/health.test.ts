import express, { Express } from 'express';
import request from 'supertest';
import { readFileSync } from 'fs';
import os from 'os';
import process from 'process';
import healthRouter, { HealthCheckResponse } from '../../src/routes/health.js';
import Logger from '../../src/utils/logger.js';

// Mock Logger
jest.mock('../../src/utils/logger.js');
const mockLogger = Logger as jest.Mocked<typeof Logger>;

// Mock fs module
jest.mock('fs');
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe('Health Check Route', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(healthRouter);
    jest.clearAllMocks();

    // Mock package.json reading
    mockReadFileSync.mockReturnValue(JSON.stringify({ version: '1.0.0' }));
  });

  // Required Test 416/test-002
  test('should return 200 status for GET /health endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.status).toBe('healthy');
  });

  // Required Test 416/test-003
  test('should include server metrics in health check response', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const healthData: HealthCheckResponse = response.body;

    // Verify response structure includes all required server metrics
    expect(healthData).toHaveProperty('status', 'healthy');
    expect(healthData).toHaveProperty('timestamp');
    expect(healthData).toHaveProperty('uptime');
    expect(healthData).toHaveProperty('version');
    expect(healthData).toHaveProperty('environment');
    expect(healthData).toHaveProperty('metrics');

    // Verify memory metrics
    expect(healthData.metrics).toHaveProperty('memory');
    expect(healthData.metrics.memory).toHaveProperty('used');
    expect(healthData.metrics.memory).toHaveProperty('total');
    expect(healthData.metrics.memory).toHaveProperty('usage');
    expect(typeof healthData.metrics.memory.used).toBe('number');
    expect(typeof healthData.metrics.memory.total).toBe('number');
    expect(typeof healthData.metrics.memory.usage).toBe('number');

    // Verify CPU metrics
    expect(healthData.metrics).toHaveProperty('cpu');
    expect(healthData.metrics.cpu).toHaveProperty('loadAverage');
    expect(healthData.metrics.cpu).toHaveProperty('cores');
    expect(Array.isArray(healthData.metrics.cpu.loadAverage)).toBe(true);
    expect(typeof healthData.metrics.cpu.cores).toBe('number');

    // Verify system metrics
    expect(healthData.metrics).toHaveProperty('system');
    expect(healthData.metrics.system).toHaveProperty('platform');
    expect(healthData.metrics.system).toHaveProperty('nodeVersion');
    expect(healthData.metrics.system).toHaveProperty('hostname');
    expect(typeof healthData.metrics.system.platform).toBe('string');
    expect(typeof healthData.metrics.system.nodeVersion).toBe('string');
    expect(typeof healthData.metrics.system.hostname).toBe('string');

    // Verify timestamp is valid ISO string
    expect(() => new Date(healthData.timestamp)).not.toThrow();
    expect(new Date(healthData.timestamp).toISOString()).toBe(healthData.timestamp);

    // Verify uptime is a positive number
    expect(healthData.uptime).toBeGreaterThanOrEqual(0);

    // Verify version matches package.json
    expect(healthData.version).toBe('1.0.0');
  });

  test('should log health check requests', async () => {
    await request(app)
      .get('/health')
      .expect(200);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Health check requested',
      expect.objectContaining({
        uptime: expect.any(Number),
        memoryUsage: expect.any(Number)
      })
    );
  });

  test('should handle package.json read errors gracefully', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.version).toBe('1.0.0');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Failed to read package.json version',
      { error: 'File not found' }
    );
  });

  test('should return 503 when health check throws error', async () => {
    // Mock os.loadavg to throw an error
    const originalLoadavg = os.loadavg;
    jest.spyOn(os, 'loadavg').mockImplementation(() => {
      throw new Error('System error');
    });

    const response = await request(app)
      .get('/health')
      .expect(503);

    expect(response.body.status).toBe('unhealthy');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Health check failed',
      expect.objectContaining({
        error: 'System error'
      })
    );

    // Restore original function
    jest.spyOn(os, 'loadavg').mockImplementation(originalLoadavg);
  });

  test('should include correct environment from NODE_ENV', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'test';

    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.environment).toBe('test');

    // Restore original environment
    process.env['NODE_ENV'] = originalEnv;
  });

  test('should calculate memory usage percentage correctly', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const { memory } = response.body.metrics;
    const expectedUsage = Math.round((memory.used / memory.total) * 100 * 100) / 100;

    expect(memory.usage).toBe(expectedUsage);
    expect(memory.usage).toBeGreaterThanOrEqual(0);
    expect(memory.usage).toBeLessThanOrEqual(100);
  });

  test('should include system information', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const { system } = response.body.metrics;

    expect(system.platform).toBe(os.platform());
    expect(system.nodeVersion).toBe(process.version);
    expect(system.hostname).toBe(os.hostname());
  });
});