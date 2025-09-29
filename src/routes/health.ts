import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { Logger } from '../utils/Logger';
import { HealthCheckResponse, ApiResponseBody } from '../types/api';
import { asyncHandler } from '../middleware/error';

const logger = new Logger('HealthRoute');

// Health check status interface for internal checks
interface HealthCheckStatus {
  status: 'healthy' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
      details?: any;
    };
  };
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  process?: {
    pid: number;
    platform: string;
    nodeVersion: string;
  };
}

// Basic health check function
export async function performHealthCheck(): Promise<HealthCheckStatus> {
  const startTime = Date.now();
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;

  const healthStatus: HealthCheckStatus = {
    status: 'healthy',
    checks: {
      system: {
        status: 'up',
        responseTime: Date.now() - startTime
      }
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
    environment: config.environment,
    memory: {
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round((usedMemory / totalMemory) * 100)
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    }
  };

  // Check if any individual checks failed
  const hasFailures = Object.values(healthStatus.checks).some(check => check.status === 'down');
  if (hasFailures) {
    healthStatus.status = 'unhealthy';
  }

  return healthStatus;
}

// Simple health check handler - returns basic status
export const healthCheck = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.info('Health check requested');

  try {
    const healthData: HealthCheckResponse = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: config.environment
    };

    const response: ApiResponseBody<HealthCheckResponse> = {
      success: true,
      data: healthData,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Health check failed:', error);

    const errorResponse: ApiResponseBody = {
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    };

    res.status(503).json(errorResponse);
  }
});

// Detailed health check handler - returns comprehensive status
export const detailedHealthCheck = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.info('Detailed health check requested');

  try {
    const healthStatus = await performHealthCheck();

    const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;

    const response: ApiResponseBody<HealthCheckStatus> = {
      success: healthStatus.status === 'healthy',
      data: healthStatus,
      timestamp: new Date().toISOString()
    };

    res.status(httpStatus).json(response);
  } catch (error) {
    logger.error('Detailed health check failed:', error);

    const errorResponse: ApiResponseBody = {
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    };

    res.status(503).json(errorResponse);
  }
});

// Readiness check - checks if service is ready to receive traffic
export const readinessCheck = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.info('Readiness check requested');

  try {
    // Perform basic readiness checks
    const isReady = true; // In a real app, you'd check database connections, etc.

    if (isReady) {
      const response: ApiResponseBody = {
        success: true,
        data: {
          status: 'ready',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } else {
      const response: ApiResponseBody = {
        success: false,
        error: 'Service not ready',
        timestamp: new Date().toISOString()
      };

      res.status(503).json(response);
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);

    const errorResponse: ApiResponseBody = {
      success: false,
      error: 'Readiness check failed',
      timestamp: new Date().toISOString()
    };

    res.status(503).json(errorResponse);
  }
});

// Liveness check - checks if service is alive (simpler than health check)
export const livenessCheck = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.info('Liveness check requested');

  const response: ApiResponseBody = {
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(response);
});

// Export default health check handler
export default healthCheck;