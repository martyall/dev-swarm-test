import { logger, LogLevel } from '../../src/utils/logger';

describe('Logger', () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleInfo: typeof console.info;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;
  let originalNodeEnv: string | undefined;
  let originalLogLevel: string | undefined;

  const capturedLogs: string[] = [];

  beforeEach(() => {
    capturedLogs.length = 0;
    originalConsoleLog = console.log;
    originalConsoleInfo = console.info;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalNodeEnv = process.env['NODE_ENV'];
    originalLogLevel = process.env['LOG_LEVEL'];

    console.log = (...args) => capturedLogs.push(args.join(' '));
    console.info = (...args) => capturedLogs.push(args.join(' '));
    console.warn = (...args) => capturedLogs.push(args.join(' '));
    console.error = (...args) => capturedLogs.push(args.join(' '));
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    process.env['NODE_ENV'] = originalNodeEnv;
    process.env['LOG_LEVEL'] = originalLogLevel;

    logger.updateConfig({
      level: LogLevel.INFO,
      enableConsole: true,
      enableTimestamps: true,
      enableColors: false
    });
  });

  describe('Logger Configuration', () => {
    it('should initialize logger configuration without errors', () => {
      expect(() => {
        const config = logger.getConfig();
        expect(config).toBeDefined();
        expect(config.level).toBeDefined();
        expect(config.enableConsole).toBeDefined();
        expect(config.enableTimestamps).toBeDefined();
        expect(config.enableColors).toBeDefined();
      }).not.toThrow();

      expect(() => {
        logger.info('Test initialization message');
      }).not.toThrow();

      expect(capturedLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Log Levels', () => {
    it('should respect configured log levels and filter messages appropriately', () => {
      logger.updateConfig({
        level: LogLevel.WARN,
        enableConsole: true,
        enableTimestamps: false
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const debugLogs = capturedLogs.filter(log => log.includes('[DEBUG]'));
      const infoLogs = capturedLogs.filter(log => log.includes('[INFO]'));
      const warnLogs = capturedLogs.filter(log => log.includes('[WARN]'));
      const errorLogs = capturedLogs.filter(log => log.includes('[ERROR]'));

      expect(debugLogs).toHaveLength(0);
      expect(infoLogs).toHaveLength(0);
      expect(warnLogs).toHaveLength(1);
      expect(errorLogs).toHaveLength(1);

      logger.updateConfig({ level: LogLevel.DEBUG });
      capturedLogs.length = 0;

      logger.debug('Debug message 2');
      logger.info('Info message 2');

      const allLogs = capturedLogs.filter(log =>
        log.includes('[DEBUG]') || log.includes('[INFO]')
      );
      expect(allLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Log Formatting', () => {
    it('should format log output with consistent structure and timestamps', () => {
      logger.updateConfig({
        level: LogLevel.INFO,
        enableConsole: true,
        enableTimestamps: true
      });

      logger.info('Test message', { userId: 123, action: 'test' });

      expect(capturedLogs.length).toBeGreaterThan(0);
      const logOutput = capturedLogs[0];

      expect(logOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(logOutput).toContain('[INFO]');
      expect(logOutput).toContain('Test message');
      expect(logOutput).toContain('{"userId":123,"action":"test"}');

      capturedLogs.length = 0;
      logger.updateConfig({ enableTimestamps: false });
      logger.info('Test without timestamp');

      const logWithoutTimestamp = capturedLogs[0];
      expect(logWithoutTimestamp).not.toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(logWithoutTimestamp).toContain('[INFO] Test without timestamp');
    });
  });

  describe('Logger Methods', () => {
    it('should provide all required logging methods', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.trace).toBe('function');
    });

    it('should handle context objects in all logging methods', () => {
      logger.updateConfig({
        level: LogLevel.DEBUG,
        enableTimestamps: false
      });

      const context = { test: 'context' };

      logger.debug('Debug with context', context);
      logger.info('Info with context', context);
      logger.warn('Warn with context', context);
      logger.error('Error with context', context);

      capturedLogs.forEach(log => {
        expect(log).toContain('{"test":"context"}');
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should allow runtime configuration updates', () => {
      const initialConfig = logger.getConfig();

      logger.updateConfig({ level: LogLevel.ERROR });
      const updatedConfig = logger.getConfig();

      expect(updatedConfig.level).toBe(LogLevel.ERROR);
      expect(updatedConfig.level).not.toBe(initialConfig.level);

      logger.updateConfig({ enableConsole: false });
      logger.error('This should not appear');

      expect(capturedLogs).toHaveLength(0);
    });
  });
});