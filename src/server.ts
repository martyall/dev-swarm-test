import express, { Application } from 'express';
import { Server } from 'http';
import { logger } from './utils/logger';
import { httpLoggingMiddleware } from './middleware/logging';
import { healthRouter } from './routes/health';

export class AppServer {
  private app: Application;
  private server: Server | null = null;
  private port: number;

  constructor(port: number = parseInt(process.env.PORT || '3000', 10)) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(httpLoggingMiddleware);
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.use(healthRouter);

    this.app.get('/', (req, res) => {
      logger.info('Root endpoint accessed');
      res.json({ message: 'Hello, TypeScript Express!' });
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        logger.info(`Server starting on port ${this.port}`);

        this.server = this.app.listen(this.port, () => {
          logger.info('Server ready to accept connections');
          resolve();
        });

        this.server.on('error', (error) => {
          logger.error('Server error:', error);
          reject(error);
        });

        this.setupGracefulShutdown();
      } catch (error) {
        logger.error('Failed to start server:', error);
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        logger.info('Server is not running');
        resolve();
        return;
      }

      logger.info('Gracefully shutting down server');

      this.server.close(() => {
        logger.info('Server shutdown complete');
        this.server = null;
        resolve();
      });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, initiating graceful shutdown`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public getApp(): Application {
    return this.app;
  }

  public isRunning(): boolean {
    return this.server !== null;
  }
}

export default AppServer;