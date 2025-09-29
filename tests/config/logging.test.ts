import { LogLevel, levels } from 'ts-log-debug';
import { createLoggingConfig, configureLogger, LoggingConfig } from '../../src/config/logging';

const logLevels = levels();

describe('Logging Configuration', () => {
  describe('createLoggingConfig', () => {
    const originalNodeEnv = process.env['NODE_ENV'];
    const originalLogLevel = process.env['LOG_LEVEL'];

    afterEach(() => {
      if (originalNodeEnv) {
        process.env['NODE_ENV'] = originalNodeEnv;
      } else {
        delete process.env['NODE_ENV'];
      }
      if (originalLogLevel) {
        process.env['LOG_LEVEL'] = originalLogLevel;
      } else {
        delete process.env['LOG_LEVEL'];
      }
    });

    it('should use appropriate log levels based on environment', () => {
      // Test production environment
      const prodConfig = createLoggingConfig('production');
      expect(prodConfig.level).toBe(logLevels.WARN);
      expect(prodConfig.environment).toBe('production');
      expect(prodConfig.format).toBe('json');

      // Test development environment
      const devConfig = createLoggingConfig('development');
      expect(devConfig.level).toBe(logLevels.DEBUG);
      expect(devConfig.environment).toBe('development');
      expect(devConfig.format).toBe('pretty');

      // Test test environment
      const testConfig = createLoggingConfig('test');
      expect(testConfig.level).toBe(logLevels.ERROR);
      expect(testConfig.environment).toBe('test');
      expect(testConfig.disableConsole).toBe(true);

      // Test default environment (explicitly pass undefined to avoid using test environment)
      delete process.env['NODE_ENV'];
      const defaultConfig = createLoggingConfig();
      expect(defaultConfig.level).toBe(logLevels.DEBUG);
      expect(defaultConfig.environment).toBe('development');

      // Test custom log level override
      const customConfig = createLoggingConfig('production', 'info');
      expect(customConfig.level).toBe(logLevels.INFO);
      expect(customConfig.environment).toBe('production');
    });

    it('should handle environment variables', () => {
      process.env['NODE_ENV'] = 'production';
      process.env['LOG_LEVEL'] = 'debug';

      const config = createLoggingConfig();
      expect(config.environment).toBe('production');
      expect(config.level).toBe(logLevels.DEBUG);
    });

    it('should handle invalid log level strings', () => {
      const config = createLoggingConfig('development', 'invalid');
      expect(config.level).toBe(logLevels.INFO);
    });
  });

  describe('configureLogger', () => {
    it('should configure logger with provided config', () => {
      const config: LoggingConfig = {
        level: logLevels.INFO,
        environment: 'development',
        disableConsole: false,
        format: 'pretty'
      };

      const logger = configureLogger(config);
      expect(logger).toBeDefined();
      expect((logger as any).level).toBe('INFO');
    });

    it('should disable console output for test environment', () => {
      const testConfig: LoggingConfig = {
        level: logLevels.ERROR,
        environment: 'test',
        disableConsole: true,
        format: 'pretty'
      };

      const logger = configureLogger(testConfig);
      expect(logger).toBeDefined();
    });
  });

  describe('log level mapping', () => {
    it('should map string log levels correctly', () => {
      const debugConfig = createLoggingConfig('development', 'debug');
      expect(debugConfig.level).toBe(logLevels.DEBUG);

      const infoConfig = createLoggingConfig('development', 'info');
      expect(infoConfig.level).toBe(logLevels.INFO);

      const warnConfig = createLoggingConfig('development', 'warn');
      expect(warnConfig.level).toBe(logLevels.WARN);

      const errorConfig = createLoggingConfig('development', 'error');
      expect(errorConfig.level).toBe(logLevels.ERROR);
    });

    it('should be case insensitive', () => {
      const upperConfig = createLoggingConfig('development', 'DEBUG');
      expect(upperConfig.level).toBe(logLevels.DEBUG);

      const mixedConfig = createLoggingConfig('development', 'WaRn');
      expect(mixedConfig.level).toBe(logLevels.WARN);
    });
  });
});