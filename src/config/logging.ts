import winston from 'winston';

export type Environment = 'development' | 'production' | 'test';

export interface LoggingConfig {
  level: string;
  format: winston.Logform.Format;
  transports: winston.transport[];
  defaultMeta?: Record<string, unknown>;
}

const getEnvironment = (): Environment => {
  const env = process.env['NODE_ENV'] as Environment;
  return env || 'development';
};

const createConsoleTransport = (level: string): winston.transport => {
  const environment = getEnvironment();

  if (environment === 'production') {
    return new winston.transports.Console({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    });
  }

  return new winston.transports.Console({
    level,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    )
  });
};

const getLogLevel = (): string => {
  const environment = getEnvironment();

  switch (environment) {
    case 'production':
      return 'warn';
    case 'test':
      return 'error';
    case 'development':
    default:
      return 'debug';
  }
};

export const createLoggingConfig = (): LoggingConfig => {
  const level = getLogLevel();
  const environment = getEnvironment();

  return {
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      createConsoleTransport(level)
    ],
    defaultMeta: {
      service: 'express-typescript-server',
      environment
    }
  };
};

export const loggingConfig = createLoggingConfig();