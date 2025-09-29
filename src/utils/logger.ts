export interface LogLevel {
  DEBUG: string;
  INFO: string;
  ERROR: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    ERROR: 'ERROR'
  };

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(level: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data })
    };
  }

  private writeLog(logEntry: LogEntry): void {
    const formattedMessage = `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}`;

    if (logEntry.level === this.logLevel.ERROR) {
      console.error(formattedMessage, logEntry.data || '');
    } else {
      console.log(formattedMessage, logEntry.data || '');
    }
  }

  public debug(message: string, data?: any): void {
    const logEntry = this.formatLog(this.logLevel.DEBUG, message, data);
    this.writeLog(logEntry);
  }

  public info(message: string, data?: any): void {
    const logEntry = this.formatLog(this.logLevel.INFO, message, data);
    this.writeLog(logEntry);
  }

  public error(message: string, data?: any): void {
    const logEntry = this.formatLog(this.logLevel.ERROR, message, data);
    this.writeLog(logEntry);
  }
}