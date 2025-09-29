import { Request, Response } from 'express';
import { HealthCheckResponse, HealthStatus } from '../types/health.types';

export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export class HealthController {
  private readonly serviceName: string;
  private readonly version: string;
  private readonly environment: string;
  private readonly startTime: number;
  private readonly logger: Logger;

  constructor(
    serviceName: string = 'health-service',
    version: string = '1.0.0',
    environment: string = process.env.NODE_ENV || 'development',
    logger: Logger
  ) {
    this.serviceName = serviceName;
    this.version = version;
    this.environment = environment;
    this.startTime = Date.now();
    this.logger = logger;
  }

  public async getHealth(req: Request, res: Response): Promise<Response> {
    try {
      this.logger.info('Health check request received', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      const uptime = Math.floor((Date.now() - this.startTime) / 1000);
      const timestamp = new Date().toISOString();

      const healthStatus: HealthStatus = {
        status: 'healthy',
        timestamp,
        uptime,
        version: this.version
      };

      const healthResponse: HealthCheckResponse = {
        service: this.serviceName,
        health: healthStatus,
        checks: {
          server: 'running',
          environment: this.environment,
          memory: this.getMemoryUsage(),
          uptime: `${uptime}s`
        }
      };

      this.logger.info('Health check completed successfully', {
        service: this.serviceName,
        status: healthStatus.status,
        uptime
      });

      return res.status(200).json(healthResponse);
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      const errorHealthStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: this.version
      };

      const errorResponse: HealthCheckResponse = {
        service: this.serviceName,
        health: errorHealthStatus,
        checks: {
          server: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      return res.status(503).json(errorResponse);
    }
  }

  private getMemoryUsage(): string {
    const used = process.memoryUsage();
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100;

    return `RSS: ${mb(used.rss)}MB, Heap: ${mb(used.heapUsed)}/${mb(used.heapTotal)}MB`;
  }
}