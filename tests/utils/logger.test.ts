import { Logger } from '../../src/utils/logger';

describe('Logger', () => {
  describe('should create singleton logger instance with proper configuration', () => {
    it('should create singleton logger instance with proper configuration', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();

      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();
      expect(logger1).toBe(logger2);
      expect(typeof logger1.debug).toBe('function');
      expect(typeof logger1.info).toBe('function');
      expect(typeof logger1.error).toBe('function');
    });
  });

  describe('should format log messages consistently across different log levels', () => {
    it('should format log messages consistently across different log levels', () => {
      const logger = Logger.getInstance();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const testMessage = 'Test message';
      const testData = { key: 'value' };

      logger.debug(testMessage, testData);
      logger.info(testMessage, testData);
      logger.error(testMessage, testData);

      expect(consoleSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      const debugCall = consoleSpy.mock.calls.find(call =>
        call[0].includes('DEBUG')
      );
      const infoCall = consoleSpy.mock.calls.find(call =>
        call[0].includes('INFO')
      );
      const errorCall = errorSpy.mock.calls.find(call =>
        call[0].includes('ERROR')
      );

      expect(debugCall).toBeDefined();
      expect(infoCall).toBeDefined();
      expect(errorCall).toBeDefined();

      [debugCall, infoCall, errorCall].forEach(call => {
        expect(call?.[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
        expect(call?.[0]).toContain(testMessage);
        expect(call?.[1]).toEqual(testData);
      });

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});