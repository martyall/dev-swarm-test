export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

export interface LoggingConfig {
  level: LogLevel;
  format: 'json' | 'text';
  includeTimestamp: boolean;
  includeCorrelationId: boolean;
}

export const getLoggingConfig = (): LoggingConfig => {
  const env = process.env.NODE_ENV || 'development';

  return {
    level: env === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
    format: env === 'production' ? 'json' : 'text',
    includeTimestamp: true,
    includeCorrelationId: env === 'production'
  };
};

export const logLevels = {
  TRACE: LogLevel.TRACE,
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR
} as const;