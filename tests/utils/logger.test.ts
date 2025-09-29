import { logger } from '../../src/utils/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
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
});