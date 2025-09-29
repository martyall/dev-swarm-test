import { logger } from '../../src/utils/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('should export configured logger instance', () => {
    // Verify logger is available after import
    expect(logger).toBeDefined();
    expect(typeof logger).toBe('object');

    // Verify logger has all required methods
    expect(typeof logger.trace).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');

    // Verify logger has correlation ID functionality
    expect(typeof logger.setCorrelationId).toBe('function');

    // Verify it's a singleton - same instance returned
    const { logger: logger2 } = require('../../src/utils/logger');
    expect(logger).toBe(logger2);
  });

  test('should log messages at different levels (debug, info, warn, error)', () => {
    // Test debug level
    logger.debug('Debug message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG] Debug message')
    );

    // Test info level
    logger.info('Info message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Info message')
    );

    // Test warn level
    logger.warn('Warning message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WARN] Warning message')
    );

    // Test error level
    logger.error('Error message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] Error message')
    );

    expect(consoleLogSpy).toHaveBeenCalledTimes(4);
  });

  test('should include optional parameters in log output', () => {
    const testData = { key: 'value', number: 42 };

    logger.info('Message with data', testData);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Message with data'),
      testData
    );
  });

  test('should set and use correlation ID', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Re-import to get new config
    jest.resetModules();
    const { logger: prodLogger } = require('../../src/utils/logger');

    prodLogger.setCorrelationId('test-correlation-123');
    prodLogger.info('Test message');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"correlationId":"test-correlation-123"')
    );

    process.env.NODE_ENV = originalEnv;
  });

  test('should format log messages with timestamps and correlation IDs', () => {
    const originalEnv = process.env.NODE_ENV;

    // Test development environment formatting (text format)
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const { logger: devLogger } = require('../../src/utils/logger');

    devLogger.info('Development message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] Development message/)
    );

    consoleLogSpy.mockClear();

    // Test production environment formatting (JSON format with correlation ID)
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    const { logger: prodLogger } = require('../../src/utils/logger');

    prodLogger.setCorrelationId('correlation-456');
    prodLogger.warn('Production warning');

    const logCall = consoleLogSpy.mock.calls[0][0];
    const parsedLog = JSON.parse(logCall);

    expect(parsedLog).toEqual({
      timestamp: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
      level: 'WARN',
      correlationId: 'correlation-456',
      message: 'Production warning',
      data: undefined
    });

    process.env.NODE_ENV = originalEnv;
  });
});