import { getLoggingConfig, LogLevel } from '../../src/config/logging';

describe('Logging Configuration', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should use appropriate log levels for development and production environments', () => {
    // Test development environment
    process.env.NODE_ENV = 'development';
    const devConfig = getLoggingConfig();

    expect(devConfig.level).toBe(LogLevel.DEBUG);
    expect(devConfig.format).toBe('text');
    expect(devConfig.includeTimestamp).toBe(true);
    expect(devConfig.includeCorrelationId).toBe(false);

    // Test production environment
    process.env.NODE_ENV = 'production';
    const prodConfig = getLoggingConfig();

    expect(prodConfig.level).toBe(LogLevel.INFO);
    expect(prodConfig.format).toBe('json');
    expect(prodConfig.includeTimestamp).toBe(true);
    expect(prodConfig.includeCorrelationId).toBe(true);

    // Test default (undefined environment)
    delete process.env.NODE_ENV;
    const defaultConfig = getLoggingConfig();

    expect(defaultConfig.level).toBe(LogLevel.DEBUG);
    expect(defaultConfig.format).toBe('text');
    expect(defaultConfig.includeTimestamp).toBe(true);
    expect(defaultConfig.includeCorrelationId).toBe(false);
  });

  test('should return consistent configuration for same environment', () => {
    process.env.NODE_ENV = 'production';

    const config1 = getLoggingConfig();
    const config2 = getLoggingConfig();

    expect(config1).toEqual(config2);
  });

  test('should include all required configuration properties', () => {
    const config = getLoggingConfig();

    expect(config).toHaveProperty('level');
    expect(config).toHaveProperty('format');
    expect(config).toHaveProperty('includeTimestamp');
    expect(config).toHaveProperty('includeCorrelationId');

    expect(typeof config.level).toBe('number');
    expect(['json', 'text']).toContain(config.format);
    expect(typeof config.includeTimestamp).toBe('boolean');
    expect(typeof config.includeCorrelationId).toBe('boolean');
  });
});