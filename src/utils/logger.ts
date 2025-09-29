import { Logger } from 'ts-log';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableTimestamps: boolean;
  enableColors: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any> | undefined;
}

class ConsoleLogger implements Logger {
  debug(message: string): void {
    console.log(message);
  }

  info(message: string): void {
    console.info(message);
  }

  warn(message: string): void {
    console.warn(message);
  }

  error(message: string): void {
    console.error(message);
  }

  trace(message: string): void {
    console.log(message);
  }
}

class SilentLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
  trace(): void {}
}

class CentralLogger implements Logger {
  private config: LoggerConfig;
  private _logger: Logger;

  constructor(config: LoggerConfig) {
    this.config = config;
    this._logger = this.createLogger();
  }

  private createLogger(): Logger {
    return this.config.enableConsole ? new ConsoleLogger() : new SilentLogger();
  }

  private formatMessage(level: string, message: string, context?: Record<string, any>): string {
    const entry: LogEntry = {
      timestamp: this.config.enableTimestamps ? new Date().toISOString() : '',
      level: level.toUpperCase(),
      message,
      context: context
    };

    let formatted = '';
    if (entry.timestamp) {
      formatted += `[${entry.timestamp}] `;
    }
    formatted += `[${entry.level}] ${entry.message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }

    return formatted;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private log(level: LogLevel, levelName: string, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    if (!this.config.enableConsole) {
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message, context);

    switch (level) {
      case LogLevel.DEBUG:
        this._logger.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        this._logger.info(formattedMessage);
        break;
      case LogLevel.WARN:
        this._logger.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        this._logger.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, 'debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, 'info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, 'warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, 'error', message, context);
  }

  trace(message: string, context?: Record<string, any>): void {
    this.debug(message, context);
  }

  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this._logger = this.createLogger();
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

const getLogLevel = (): LogLevel => {
  const envLevel = process.env['LOG_LEVEL']?.toUpperCase();

  switch (envLevel) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    default:
      return process.env['NODE_ENV'] === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }
};

const defaultConfig: LoggerConfig = {
  level: getLogLevel(),
  enableConsole: true,
  enableTimestamps: true,
  enableColors: process.env['NODE_ENV'] !== 'production',
};

export const logger = new CentralLogger(defaultConfig);

export default logger;