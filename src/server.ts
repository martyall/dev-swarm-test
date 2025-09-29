import express, { Application, Request, Response } from 'express';
import { Server } from 'http';
import { config } from './config';
import { Logger } from './utils/logger';
import { AppServer, ServerHooks } from './types/express';
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers, asyncHandler } from './middleware/error';
import healthCheck, { detailedHealthCheck, readinessCheck, livenessCheck } from './routes/health';
import { ApiResponseBody } from './types/api';

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
    // Trust proxy if behind load balancer
    this.app.set('trust proxy', true);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security headers middleware
    this.app.use((req: Request, res: Response, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Request context and logging middleware
    this.app.use((req: Request, res: Response, next) => {
      // Add request ID for tracking
      const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      (req as any).requestId = requestId;

      // Log request
      this.logger.info(`${req.method} ${req.path}`, {
        requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoints - using dedicated route handlers
    this.app.get('/health', healthCheck);
    this.app.get('/health/detailed', detailedHealthCheck);
    this.app.get('/health/ready', readinessCheck);
    this.app.get('/health/live', livenessCheck);

    // Root endpoint - using async handler for consistency
    this.app.get('/', asyncHandler(async (req: Request, res: Response) => {
      const response: ApiResponseBody = {
        success: true,
        message: 'Express TypeScript Server is running',
        data: {
          timestamp: new Date().toISOString(),
          environment: config.environment,
          version: process.env['npm_package_version'] || '1.0.0',
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    }));

    // API info endpoint
    this.app.get('/api', asyncHandler(async (req: Request, res: Response) => {
      const response: ApiResponseBody = {
        success: true,
        data: {
          name: 'Express TypeScript API',
          version: process.env['npm_package_version'] || '1.0.0',
          environment: config.environment,
          endpoints: {
            health: '/health',
            healthDetailed: '/health/detailed',
            healthReadiness: '/health/ready',
            healthLiveness: '/health/live',
            root: '/',
            api: '/api'
          },
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    }));
  }

  private setupErrorHandling(): void {
    // 404 handler - must come after all routes
    this.app.use(notFoundHandler);

    // Global error handler - must come last
    this.app.use(errorHandler);
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

// Setup global error handlers once when the module is loaded
let globalHandlersSetup = false;
export function ensureGlobalErrorHandlers(): void {
  if (!globalHandlersSetup) {
    setupGlobalErrorHandlers();
    globalHandlersSetup = true;
  }
}

// Export default instance
export default createServer();