import winston from 'winston';
import { loggingConfig } from '../config/logging.js';

export class Logger {
  private static instance: winston.Logger | null = null;
  private static correlationId: string | null = null;

  private constructor() {}

  public static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = winston.createLogger(loggingConfig);
    }
    return Logger.instance;
  }

  public static createLogger(config?: Partial<winston.LoggerOptions>): winston.Logger {
    const mergedConfig = { ...loggingConfig, ...config };
    return winston.createLogger(mergedConfig);
  }

  public static setCorrelationId(id: string): void {
    Logger.correlationId = id;
  }

  public static getCorrelationId(): string | null {
    return Logger.correlationId;
  }

  public static clearCorrelationId(): void {
    Logger.correlationId = null;
  }

  private static addCorrelationId(message: any): any {
    if (Logger.correlationId && typeof message === 'object' && message !== null) {
      return { ...message, correlationId: Logger.correlationId };
    }
    return message;
  }

  public static debug(message: string, meta?: Record<string, unknown>): void {
    const logger = Logger.getInstance();
    const enrichedMeta = Logger.addCorrelationId(meta || {});
    logger.debug(message, enrichedMeta);
  }

  public static info(message: string, meta?: Record<string, unknown>): void {
    const logger = Logger.getInstance();
    const enrichedMeta = Logger.addCorrelationId(meta || {});
    logger.info(message, enrichedMeta);
  }

  public static warn(message: string, meta?: Record<string, unknown>): void {
    const logger = Logger.getInstance();
    const enrichedMeta = Logger.addCorrelationId(meta || {});
    logger.warn(message, enrichedMeta);
  }

  public static error(message: string, meta?: Record<string, unknown>): void {
    const logger = Logger.getInstance();
    const enrichedMeta = Logger.addCorrelationId(meta || {});
    logger.error(message, enrichedMeta);
  }
}

export const logger = Logger.getInstance();
export default Logger;