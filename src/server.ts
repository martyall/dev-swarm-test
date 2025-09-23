import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ServerConfig {
  port: number;
  env: string;
}

export class Server {
  private app: Express;
  private config: ServerConfig;

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
      const server = this.app.listen(this.config.port, () => {
        console.log(`🚀 Server running on port ${this.config.port}`);
        console.log(`📊 Environment: ${this.config.env}`);
        console.log(`🏥 Health check: http://localhost:${this.config.port}/health`);
        resolve();
      });

      // Graceful shutdown
      const gracefulShutdown = (signal: string) => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        server.close(() => {
          console.log('✅ Server closed');
          process.exit(0);
        });
      };

      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    });
  }
}

export default Server;