import { Request, Response, Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import process from 'process';
import Logger from '../utils/logger.js';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  metrics: {
    memory: {
      used: number;
      total: number;
      usage: number;
    };
    cpu: {
      loadAverage: number[];
      cores: number;
    };
    system: {
      platform: string;
      nodeVersion: string;
      hostname: string;
    };
  };
}

const getPackageVersion = (): string => {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      version?: string;
    };
    return packageJson.version || '1.0.0';
  } catch (error) {
    Logger.warn('Failed to read package.json version', {
      error: (error as Error).message,
    });
    return '1.0.0';
  }
};

export const healthCheckHandler = (req: Request, res: Response): void => {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemory = memoryUsage.heapUsed;
    const memoryUsagePercent =
      Math.round((usedMemory / totalMemory) * 100 * 100) / 100;

    const healthData: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: getPackageVersion(),
      environment: process.env['NODE_ENV'] || 'development',
      metrics: {
        memory: {
          used: usedMemory,
          total: totalMemory,
          usage: memoryUsagePercent,
        },
        cpu: {
          loadAverage: os.loadavg(),
          cores: os.cpus().length,
        },
        system: {
          platform: os.platform(),
          nodeVersion: process.version,
          hostname: os.hostname(),
        },
      },
    };

    Logger.info('Health check requested', {
      requestId: (req as { id?: string }).id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      uptime: healthData.uptime,
      memoryUsage: memoryUsagePercent,
    });

    res.status(200).json(healthData);
  } catch (error) {
    const errorMessage = (error as Error).message;

    Logger.error('Health check failed', {
      error: errorMessage,
      requestId: (req as { id?: string }).id,
      ip: req.ip,
    });

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: getPackageVersion(),
      environment: process.env['NODE_ENV'] || 'development',
      metrics: {
        memory: { used: 0, total: 0, usage: 0 },
        cpu: { loadAverage: [], cores: 0 },
        system: {
          platform: 'unknown',
          nodeVersion: process.version,
          hostname: 'unknown',
        },
      },
    };

    res.status(503).json(errorResponse);
  }
};

const router = Router();

router.get('/health', healthCheckHandler);

export default router;
