import { getLogger } from '../../src/utils/logger';

describe('Logger Utility', () => {
  afterEach(() => {
    // Clean up any logger state if needed
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should create and return singleton logger instance', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();
      expect(logger1).toBe(logger2); // Same instance

      // Verify it has the expected ts-log methods
      expect(typeof logger1.info).toBe('function');
      expect(typeof logger1.error).toBe('function');
      expect(typeof logger1.warn).toBe('function');
      expect(typeof logger1.debug).toBe('function');
    });

    it('should return same instance across multiple calls', () => {
      const instances = Array.from({ length: 5 }, () => getLogger());

      instances.forEach(instance => {
        expect(instance).toBe(instances[0]);
      });
    });
  });

  describe('Structured Logging', () => {
    it('should include timestamp and correlation ID in log entries', () => {
      const logger = getLogger();
      const mockConsoleInfo = jest.spyOn(console, 'log').mockImplementation();

      const correlationId = 'test-correlation-id';
      const testMessage = 'Test log message';
      const timestamp = new Date().toISOString();

      // Mock Date.now to control timestamp
      const dateSpy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(timestamp);

      logger.info(testMessage, { correlationId, additionalData: 'test' });

      expect(mockConsoleInfo).toHaveBeenCalled();
      const logCall = mockConsoleInfo.mock.calls[0];
      expect(logCall).toBeDefined();
      const logMessage = logCall![0] as string;

      // Verify structured format includes timestamp and correlation ID
      expect(logMessage).toContain(timestamp);
      expect(logCall![1]).toEqual(expect.objectContaining({
        correlationId,
        additionalData: 'test',
        timestamp
      }));

      dateSpy.mockRestore();
      mockConsoleInfo.mockRestore();
    });

    it('should handle logs without correlation ID', () => {
      const logger = getLogger();
      const mockConsoleInfo = jest.spyOn(console, 'log').mockImplementation();

      const testMessage = 'Test log without correlation ID';
      logger.info(testMessage);

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );

      mockConsoleInfo.mockRestore();
    });
  });

  describe('Log Levels', () => {
    it('should support all log levels', () => {
      const logger = getLogger();
      const mockConsole = {
        log: jest.spyOn(console, 'log').mockImplementation(),
        error: jest.spyOn(console, 'error').mockImplementation(),
        warn: jest.spyOn(console, 'warn').mockImplementation(),
        debug: jest.spyOn(console, 'debug').mockImplementation(),
      };

      logger.info('Info message');
      logger.error('Error message');
      logger.warn('Warn message');
      logger.debug('Debug message');

      // Check the calls contain the expected levels and messages
      expect(mockConsole.log.mock.calls[0]![0]).toContain('[INFO]');
      expect(mockConsole.log.mock.calls[0]![0]).toContain('Info message');

      expect(mockConsole.error.mock.calls[0]![0]).toContain('[ERROR]');
      expect(mockConsole.error.mock.calls[0]![0]).toContain('Error message');

      expect(mockConsole.warn.mock.calls[0]![0]).toContain('[WARN]');
      expect(mockConsole.warn.mock.calls[0]![0]).toContain('Warn message');

      expect(mockConsole.debug.mock.calls[0]![0]).toContain('[DEBUG]');
      expect(mockConsole.debug.mock.calls[0]![0]).toContain('Debug message');

      Object.values(mockConsole).forEach(mock => mock.mockRestore());
    });
  });

  describe('Context and Metadata', () => {
    it('should include context in log entries', () => {
      const logger = getLogger();
      const mockConsoleInfo = jest.spyOn(console, 'log').mockImplementation();

      const context = 'TestService';
      logger.info('Test message', { context });

      const logCall = mockConsoleInfo.mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall![0]).toContain('[INFO]');
      expect(logCall![0]).toContain('Test message');
      expect(logCall![1]).toEqual(expect.objectContaining({
        context,
        timestamp: expect.any(String)
      }));

      mockConsoleInfo.mockRestore();
    });
  });
});