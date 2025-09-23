import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';

// Load environment variables
dotenv.config();

export interface ServerConfig {
  port: number;
  env: string;
}

export class Server {
  private app: Express;
  private config: ServerConfig;
  private httpServer?: http.Server;
  private isShuttingDown: boolean = false;
  private startTime: Date;

  constructor(config?: Partial<ServerConfig>) {
    this.startTime = new Date();
    this.config = {
      port: config?.port || parseInt(process.env.PORT || '3000', 10),
      env: config?.env || process.env.NODE_ENV || 'development',
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS middleware
    this.app.use(cors());

    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    if (this.config.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      const now = new Date();
      const uptime = Math.floor((now.getTime() - this.startTime.getTime()) / 1000);

      const healthData = {
        status: 'ok',
        timestamp: now.toISOString(),
        uptime: uptime,
        environment: this.config.env,
        version: process.version,
        ...(this.config.env !== 'production' && {
          memory: this.getMemoryUsage(),
          pid: process.pid,
        }),
      };

      res.status(200).json(healthData);
    });
  }

  private getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
    };
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      // Skip if response already sent
      if (res.headersSent) {
        return next(error);
      }

      // Handle different error types
      let errorMessage: string;
      let statusCode = 500;

      if (error instanceof Error) {
        errorMessage = error.message;
        // Log full error details
        console.error('Server Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('Request:', {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
      } else if (typeof error === 'string') {
        errorMessage = error;
        console.error('String Error:', error);
      } else if (error === null || error === undefined) {
        errorMessage = 'Unknown error occurred';
        console.error('Null/Undefined Error:', error);
      } else {
        errorMessage = 'Unexpected error format';
        console.error('Unexpected Error:', error);
      }

      // Handle custom status codes
      if (error && typeof error === 'object' && error.statusCode) {
        statusCode = error.statusCode;
      } else if (error && typeof error === 'object' && error.status) {
        statusCode = error.status;
      }

      // Ensure status code is valid HTTP error code
      if (statusCode < 400 || statusCode >= 600) {
        statusCode = 500;
      }

      const responsePayload = {
        status: 'error',
        message: this.config.env === 'production' ? 'Internal server error' : errorMessage,
        timestamp: new Date().toISOString(),
        ...(this.config.env !== 'production' && { path: req.path }),
      };

      res.status(statusCode).json(responsePayload);
    });

    // Handle 404 errors for undefined routes (this should be after all other routes)
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public getConfig(): ServerConfig {
    return this.config;
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.config.port, () => {
        console.log(`🚀 Server running on port ${this.config.port}`);
        console.log(`📊 Environment: ${this.config.env}`);
        console.log(`🏥 Health check: http://localhost:${this.config.port}/health`);
        resolve();
      });

      this.setupGracefulShutdown();
    });
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      if (this.isShuttingDown) {
        console.log(`🛑 Already shutting down, ignoring ${signal}`);
        return;
      }

      this.isShuttingDown = true;
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      if (this.httpServer) {
        this.httpServer.close((error) => {
          if (error) {
            console.error('❌ Error during server shutdown:', error);
            process.exit(1);
          } else {
            console.log('✅ Server closed');
            process.exit(0);
          }
        });

        // Force shutdown after timeout
        setTimeout(() => {
          console.log('⚠️ Forcing shutdown due to timeout');
          process.exit(1);
        }, 10000);
      } else {
        console.log('✅ No server to close');
        process.exit(0);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.httpServer) {
        resolve();
        return;
      }

      this.isShuttingDown = true;
      this.httpServer.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public getServer(): http.Server | undefined {
    return this.httpServer;
  }
}

export default Server;