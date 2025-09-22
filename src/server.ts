import express, { Application } from 'express';
import { Server } from 'http';

export class ExpressServer {
  private app: Application;
  private server: Server | null = null;
  private port: number;

  constructor(port?: number) {
    this.app = express();
    this.port = port || this.getPortFromEnvironment();
    this.setupMiddleware();
  }

  private getPortFromEnvironment(): number {
    const envPort = process.env.PORT;
    return envPort ? parseInt(envPort, 10) : 3000;
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
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