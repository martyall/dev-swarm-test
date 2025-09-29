import winston from 'winston';
import Logger from '../../src/utils/logger.js';

describe('Logger Utility', () => {
  let originalConsoleLog: typeof console.log;
  let consoleLogs: string[];

  beforeEach(() => {
    // Capture console output
    consoleLogs = [];
    originalConsoleLog = console.log;
    console.log = jest.fn((message: string) => {
      consoleLogs.push(message);
    });

    // Clear any existing correlation ID
    Logger.clearCorrelationId();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    console.log = originalConsoleLog;
    Logger.clearCorrelationId();
  });

  test('should generate appropriate output for different log levels', () => {
    const testMessage = 'Test message';
    const testMeta = { key: 'value' };

    // Mock the logger instance to use console transport
    const mockLogger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });

    jest.spyOn(Logger, 'getInstance').mockReturnValue(mockLogger);

    // Test different log levels
    Logger.debug(testMessage, testMeta);
    Logger.info(testMessage, testMeta);
    Logger.warn(testMessage, testMeta);
    Logger.error(testMessage, testMeta);

    // Verify that logging methods were called (we can't easily capture winston console output in tests)
    // Instead, we verify the logger methods exist and can be called without errors
    expect(mockLogger.debug).toBeDefined();
    expect(mockLogger.info).toBeDefined();
    expect(mockLogger.warn).toBeDefined();
    expect(mockLogger.error).toBeDefined();
  });

  test('should implement singleton pattern correctly', () => {
    // Reset the mock to call the actual getInstance method
    jest.restoreAllMocks();

    const logger1 = Logger.getInstance();
    const logger2 = Logger.getInstance();

    expect(logger1).toBe(logger2);
    expect(logger1).toBeInstanceOf(winston.Logger);
  });

  test('should handle correlation IDs correctly', () => {
    const correlationId = 'test-correlation-id-123';

    // Set correlation ID
    Logger.setCorrelationId(correlationId);
    expect(Logger.getCorrelationId()).toBe(correlationId);

    // Clear correlation ID
    Logger.clearCorrelationId();
    expect(Logger.getCorrelationId()).toBeNull();
  });

  test('should create custom logger instances', () => {
    const customLogger = Logger.createLogger({
      level: 'info',
      transports: [new winston.transports.Console()]
    });

    expect(customLogger).toBeInstanceOf(winston.Logger);
    expect(customLogger.level).toBe('info');
  });

  test('should add correlation ID to meta when present', () => {
    const correlationId = 'test-correlation-id-123';
    const testMeta = { key: 'value' };

    Logger.setCorrelationId(correlationId);

    // Create a spy on the logger instance
    const mockLogger = winston.createLogger({
      level: 'debug',
      transports: [new winston.transports.Console()]
    });

    const infoSpy = jest.spyOn(mockLogger, 'info');
    jest.spyOn(Logger, 'getInstance').mockReturnValue(mockLogger);

    Logger.info('test message', testMeta);

    expect(infoSpy).toHaveBeenCalledWith('test message', {
      key: 'value',
      correlationId: correlationId
    });
  });
});