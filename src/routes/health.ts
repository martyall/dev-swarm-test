import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const healthRouter = Router();

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

healthRouter.get('/health', (req: Request, res: Response) => {
  try {
    const healthData: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    logger.debug('Health check requested');

    res.status(200).json(healthData);
  } catch (error) {
    logger.error('Health check failed:', error);

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

export default healthRouter;