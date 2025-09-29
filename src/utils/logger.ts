import { Logger as TSLogLogger } from 'ts-log-debug';
import { logger as configuredLogger } from '../config/logging';

export interface LogMetadata {
  correlationId?: string;
  context?: string;
  [key: string]: unknown;
}

export interface StructuredLogger {
  info(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  debug(message: string, metadata?: LogMetadata): void;
  trace(message: string, metadata?: LogMetadata): void;
  fatal(message: string, metadata?: LogMetadata): void;
}

// Legacy Logger class for backward compatibility
export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  public info(message: string, ...args: unknown[]): void {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`, ...args);
  }
}

class SingletonLogger implements StructuredLogger {
  private tsLogInstance: TSLogLogger;

  constructor(tsLogInstance: TSLogLogger) {
    this.tsLogInstance = tsLogInstance;
  }

  private formatMessage(level: string, message: string, metadata?: LogMetadata): [string, LogMetadata | undefined] {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    if (metadata) {
      return [formattedMessage, { ...metadata, timestamp }];
    }

    return [formattedMessage, { timestamp }];
  }

  public info(message: string, metadata?: LogMetadata): void {
    const [formattedMessage, logMetadata] = this.formatMessage('INFO', message, metadata);
    if (logMetadata && Object.keys(logMetadata).length > 1) {
      console.log(formattedMessage, logMetadata);
    } else {
      console.log(formattedMessage);
    }
  }

  public error(message: string, metadata?: LogMetadata): void {
    const [formattedMessage, logMetadata] = this.formatMessage('ERROR', message, metadata);
    if (logMetadata && Object.keys(logMetadata).length > 1) {
      console.error(formattedMessage, logMetadata);
    } else {
      console.error(formattedMessage);
    }
  }

  public warn(message: string, metadata?: LogMetadata): void {
    const [formattedMessage, logMetadata] = this.formatMessage('WARN', message, metadata);
    if (logMetadata && Object.keys(logMetadata).length > 1) {
      console.warn(formattedMessage, logMetadata);
    } else {
      console.warn(formattedMessage);
    }
  }

  public debug(message: string, metadata?: LogMetadata): void {
    const [formattedMessage, logMetadata] = this.formatMessage('DEBUG', message, metadata);
    if (logMetadata && Object.keys(logMetadata).length > 1) {
      console.debug(formattedMessage, logMetadata);
    } else {
      console.debug(formattedMessage);
    }
  }

  public trace(message: string, metadata?: LogMetadata): void {
    const [formattedMessage, logMetadata] = this.formatMessage('TRACE', message, metadata);
    if (logMetadata && Object.keys(logMetadata).length > 1) {
      console.debug(formattedMessage, logMetadata);
    } else {
      console.debug(formattedMessage);
    }
  }

  public fatal(message: string, metadata?: LogMetadata): void {
    const [formattedMessage, logMetadata] = this.formatMessage('FATAL', message, metadata);
    if (logMetadata && Object.keys(logMetadata).length > 1) {
      console.error(formattedMessage, logMetadata);
    } else {
      console.error(formattedMessage);
    }
  }
}

let singletonInstance: StructuredLogger | null = null;

export function getLogger(): StructuredLogger {
  if (!singletonInstance) {
    singletonInstance = new SingletonLogger(configuredLogger);
  }
  return singletonInstance;
}

export function createCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}`;
}

export default {
  getLogger,
  createCorrelationId
};