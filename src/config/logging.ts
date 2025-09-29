import { Logger } from 'ts-log';
import { LogLevel, Logger as TSLogLogger, levels, $log } from 'ts-log-debug';

export interface LoggingConfig {
  level: LogLevel;
  environment: string;
  disableConsole: boolean;
  format: string;
}

export type LogLevelString = 'debug' | 'info' | 'warn' | 'error';

const logLevels = levels();

const mapStringToLogLevel = (level: string): LogLevel => {
  switch (level.toLowerCase()) {
    case 'debug':
      return logLevels.DEBUG;
    case 'info':
      return logLevels.INFO;
    case 'warn':
      return logLevels.WARN;
    case 'error':
      return logLevels.ERROR;
    default:
      return logLevels.INFO;
  }
};

const getLogLevelForEnvironment = (environment: string, configuredLevel?: string): LogLevel => {
  if (configuredLevel) {
    return mapStringToLogLevel(configuredLevel);
  }

  switch (environment.toLowerCase()) {
    case 'production':
      return logLevels.WARN;
    case 'test':
      return logLevels.ERROR;
    case 'development':
    default:
      return logLevels.DEBUG;
  }
};

export const createLoggingConfig = (
  environment: string = process.env['NODE_ENV'] || 'development',
  logLevel?: string
): LoggingConfig => {
  const level = getLogLevelForEnvironment(environment, logLevel || process.env['LOG_LEVEL']);

  return {
    level,
    environment,
    disableConsole: environment === 'test',
    format: environment === 'production' ? 'json' : 'pretty'
  };
};

export const configureLogger = (config: LoggingConfig): TSLogLogger => {
  const loggerInstance = new TSLogLogger();

  loggerInstance.level = config.level.toString();

  if (!config.disableConsole) {
    loggerInstance.appenders
      .set('console', {
        type: 'console',
        levels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
      });
  }

  return loggerInstance;
};

export const loggingConfig = createLoggingConfig();
export const logger = configureLogger(loggingConfig);

export default {
  loggingConfig,
  logger,
  createLoggingConfig,
  configureLogger
};