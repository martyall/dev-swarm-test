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

  constructor(config?: Partial<ServerConfig>) {
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
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler for undefined routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Server Error:', error.message);
      console.error('Stack:', error.stack);

      res.status(500).json({
        status: 'error',
        message: this.config.env === 'production' ? 'Internal server error' : error.message,
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