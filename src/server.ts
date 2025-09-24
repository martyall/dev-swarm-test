import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { healthRouter } from './routes/health';

export class Server {
  private app: Express;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.app.use('/health', healthRouter);
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      const server = this.app.listen(this.port, () => {
        console.log(`Server is running on port ${this.port}`);
        console.log(`Health check available at http://localhost:${this.port}/health`);
        resolve();
      });

      // Graceful shutdown handling
      const gracefulShutdown = (signal: string) => {
        console.log(`Received ${signal}. Shutting down gracefully...`);
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      };

      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    });
  }

  public getApp(): Express {
    return this.app;
  }
}