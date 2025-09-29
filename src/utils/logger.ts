import { Logger } from 'ts-log';
import { getLoggingConfig, LogLevel } from '../config/logging';

class AppLogger implements Logger {
  private config = getLoggingConfig();
  private correlationId?: string;

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  private formatMessage(level: string, message: string, ...optionalParams: any[]): void {
    if (this.shouldLog(this.getLogLevel(level))) {
      const timestamp = this.config.includeTimestamp ? new Date().toISOString() : '';
      const correlation = this.config.includeCorrelationId && this.correlationId
        ? `[${this.correlationId}]`
        : '';

      const prefix = [timestamp, correlation, `[${level.toUpperCase()}]`]
        .filter(Boolean)
        .join(' ');

      if (this.config.format === 'json') {
        console.log(JSON.stringify({
          timestamp,
          level: level.toUpperCase(),
          correlationId: this.correlationId,
          message,
          data: optionalParams.length > 0 ? optionalParams : undefined
        }));
      } else {
        console.log(`${prefix} ${message}`, ...optionalParams);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'trace': return LogLevel.TRACE;
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  trace(message?: any, ...optionalParams: any[]): void {
    this.formatMessage('trace', message || '', ...optionalParams);
  }

  debug(message?: any, ...optionalParams: any[]): void {
    this.formatMessage('debug', message || '', ...optionalParams);
  }

  info(message?: any, ...optionalParams: any[]): void {
    this.formatMessage('info', message || '', ...optionalParams);
  }

  warn(message?: any, ...optionalParams: any[]): void {
    this.formatMessage('warn', message || '', ...optionalParams);
  }

  error(message?: any, ...optionalParams: any[]): void {
    this.formatMessage('error', message || '', ...optionalParams);
  }
}

const logger = new AppLogger();

export { logger };
export default logger;