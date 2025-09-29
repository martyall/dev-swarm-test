import express, { Application } from 'express';
import Logger from './utils/logger.js';
import loggingMiddleware from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import healthRouter from './routes/health.js';

export interface ServerConfig {
  port: number;
  host: string;
  environment: string;
}

export class ExpressServer {
  private app: Application;
  private config: ServerConfig;
  private server: any = null;

  constructor(config?: Partial<ServerConfig>) {
    this.config = {
      port: Number(process.env['PORT']) || 3000,
      host: process.env['HOST'] || '0.0.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      ...config
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Enable JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Add logging middleware
    this.app.use(loggingMiddleware);

    Logger.info('Middleware configured', {
      environment: this.config.environment,
      jsonLimit: '10mb',
      urlencodedLimit: '10mb'
    });
  }

  private setupRoutes(): void {
    // Health check route
    this.app.use('/', healthRouter);

    Logger.info('Routes configured', {
      routes: ['/health'],
      totalRoutes: 1
    });
  }

  private setupErrorHandling(): void {
    // 404 handler - must be after all other routes
    this.app.use(notFoundHandler);

    // Error handler - must be last middleware
    this.app.use(errorHandler);

    Logger.info('Error handling middleware configured');
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          Logger.info('Express server started successfully', {
            port: this.config.port,
            host: this.config.host,
            environment: this.config.environment,
            nodeVersion: process.version,
            pid: process.pid
          });
          resolve();
        });

        this.server.on('error', (error: Error) => {
          Logger.error('Server startup failed', {
            error: error.message,
            port: this.config.port,
            host: this.config.host,
            stack: error.stack
          });
          reject(error);
        });

      } catch (error) {
        Logger.error('Failed to start server', {
          error: (error as Error).message,
          stack: (error as Error).stack
        });
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        Logger.warn('Attempted to stop server that is not running');
        resolve();
        return;
      }

      this.server.close((error?: Error) => {
        if (error) {
          Logger.error('Error stopping server', {
            error: error.message,
            stack: error.stack
          });
          reject(error);
        } else {
          Logger.info('Express server stopped successfully');
          this.server = null;
          resolve();
        }
      });
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public getConfig(): ServerConfig {
    return { ...this.config };
  }

  public isListening(): boolean {
    return this.server !== null && this.server.listening;
  }

  public getAddress(): string | null {
    if (!this.server || !this.server.listening) {
      return null;
    }

    const address = this.server.address();
    if (typeof address === 'string') {
      return address;
    }

    if (address && typeof address === 'object') {
      return `${address.address}:${address.port}`;
    }

    return null;
  }
}


// Factory function for easy server creation
export const createServer = (config?: Partial<ServerConfig>): ExpressServer => {
  return new ExpressServer(config);
};

// Default export
export default ExpressServer;