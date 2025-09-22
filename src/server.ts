import express, { Application, Request, Response, NextFunction } from 'express';
import { Server } from 'http';

export class ExpressServer {
  private app: Application;
  private server: Server | null = null;
  private port: number;

  constructor(port?: number) {
    this.app = express();
    this.port = port || this.getPortFromEnvironment();
    this.setupMiddleware();
    this.setupProcessErrorHandlers();
  }

  private getPortFromEnvironment(): number {
    const envPort = process.env.PORT;
    return envPort ? parseInt(envPort, 10) : 3000;
  }

  private setupMiddleware(): void {
    this.app.use(this.requestLoggingMiddleware);
    this.app.use(express.json());
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    console.log(`${req.method} ${req.url}`);
    next();
  };

  private setupErrorHandling(): void {
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(`Error occurred: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
      
      if (res.headersSent) {
        return next(error);
      }
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    });
  }

  private setupProcessErrorHandlers(): void {
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('Process will exit to prevent undefined behavior');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      console.error('Unhandled Rejection at:', promise);
      console.error('Reason:', reason);
      console.error('Process will exit to prevent undefined behavior');
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      this.gracefulShutdown();
    });
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      console.log('Starting graceful shutdown...');
      await this.stop();
      console.log('Server shut down successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

    // Test endpoint to trigger errors for testing error handling
    this.app.get('/test-error', (req, res, next) => {
      const error = new Error('Test error for error handling');
      next(error);
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public async start(): Promise<Server> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`Server is running on port ${this.port}`);
          resolve(this.server!);
        });

        this.server.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((error) => {
          if (error) {
            reject(error);
          } else {
            this.server = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  public getPort(): number {
    return this.port;
  }
}

export default ExpressServer;