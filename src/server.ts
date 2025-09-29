import express, { Application, Request, Response } from 'express';
import { Server } from 'http';
import { config } from './config';
import { Logger } from './utils/Logger';
import { AppServer, ServerHooks } from './types/express';

export class ExpressServer implements AppServer {
  public app: Application;
  public server: Server | null = null;
  public port: number;
  public host: string;
  public isRunning: boolean = false;

  private readonly logger: Logger;
  private readonly hooks: ServerHooks;
  private readonly shutdownTimeout = 10000; // 10 seconds

  constructor(hooks: ServerHooks = {}) {
    this.app = express();
    this.port = config.port;
    this.host = process.env['HOST'] || '0.0.0.0';
    this.logger = new Logger('ExpressServer');
    this.hooks = hooks;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next) => {
      this.logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          version: process.env['npm_package_version'] || '1.0.0',
          environment: config.environment
        }
      });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Express TypeScript Server is running',
        data: {
          timestamp: new Date().toISOString(),
          environment: config.environment
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: any) => {
      this.logger.error('Unhandled error:', error);

      const statusCode = (error as any).statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: config.environment === 'production'
          ? 'Internal server error'
          : error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      this.logger.info(`${signal} received, initiating graceful shutdown...`);
      await this.stop();
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')); // Nodemon restart
  }

  public async start(): Promise<void> {
    try {
      if (this.hooks.beforeStart) {
        await this.hooks.beforeStart();
      }

      await new Promise<void>((resolve, reject) => {
        this.server = this.app.listen(this.port, this.host, () => {
          this.isRunning = true;
          this.logger.info(`Server started on ${this.host}:${this.port} (${config.environment})`);
          resolve();
        });

        this.server.on('error', (error: Error) => {
          this.logger.error('Server startup error:', error);
          reject(error);
        });
      });

      if (this.hooks.afterStart) {
        await this.hooks.afterStart(this);
      }
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.server || !this.isRunning) {
      this.logger.info('Server is not running');
      return;
    }

    try {
      if (this.hooks.beforeShutdown) {
        await this.hooks.beforeShutdown(this);
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.logger.warn('Graceful shutdown timeout, forcing exit');
          reject(new Error('Shutdown timeout'));
        }, this.shutdownTimeout);

        this.server!.close((error) => {
          clearTimeout(timeout);
          if (error) {
            this.logger.error('Error during server shutdown:', error);
            reject(error);
          } else {
            this.isRunning = false;
            this.server = null;
            this.logger.info('Server stopped gracefully');
            resolve();
          }
        });
      });

      if (this.hooks.afterShutdown) {
        await this.hooks.afterShutdown();
      }
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      throw error;
    }
  }

  public getAddress(): string | null {
    if (!this.server || !this.isRunning) {
      return null;
    }
    const address = this.server.address();
    if (typeof address === 'string') {
      return address;
    }
    return address ? `${address.address}:${address.port}` : null;
  }
}

// Factory function for creating server instances
export function createServer(hooks?: ServerHooks): ExpressServer {
  return new ExpressServer(hooks);
}

// Export default instance
export default createServer();