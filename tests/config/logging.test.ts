import { createLoggingConfig } from '../../src/config/logging.js';

describe('Logging Configuration', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env['NODE_ENV'];
  });

  afterEach(() => {
    if (originalEnv) {
      process.env['NODE_ENV'] = originalEnv;
    } else {
      delete process.env['NODE_ENV'];
    }
  });

  test('should adjust logging levels based on environment configuration', () => {
    // Test development environment (default)
    delete process.env['NODE_ENV'];
    let config = createLoggingConfig();
    expect(config.level).toBe('debug');
    expect(config.defaultMeta?.['environment']).toBe('development');

    // Test development environment explicitly
    process.env['NODE_ENV'] = 'development';
    config = createLoggingConfig();
    expect(config.level).toBe('debug');
    expect(config.defaultMeta?.['environment']).toBe('development');

    // Test production environment
    process.env['NODE_ENV'] = 'production';
    config = createLoggingConfig();
    expect(config.level).toBe('warn');
    expect(config.defaultMeta?.['environment']).toBe('production');

    // Test test environment
    process.env['NODE_ENV'] = 'test';
    config = createLoggingConfig();
    expect(config.level).toBe('error');
    expect(config.defaultMeta?.['environment']).toBe('test');

    // Verify configuration structure
    expect(config).toHaveProperty('level');
    expect(config).toHaveProperty('format');
    expect(config).toHaveProperty('transports');
    expect(config).toHaveProperty('defaultMeta');
    expect(config.transports).toHaveLength(1);
    expect(config.defaultMeta?.['service']).toBe('express-typescript-server');
  });
});