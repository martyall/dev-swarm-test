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