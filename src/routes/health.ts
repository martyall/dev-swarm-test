import { Router } from 'express';
import { HealthController, Logger } from '../controllers/health.controller';

export function createHealthRoutes(logger: Logger): Router {
  const router = Router();

  // Create health controller instance
  const healthController = new HealthController(
    process.env.SERVICE_NAME || 'api-service',
    process.env.SERVICE_VERSION || '1.0.0',
    process.env.NODE_ENV || 'development',
    logger
  );

  // GET /health endpoint
  router.get('/health', (req, res) => {
    return healthController.getHealth(req, res);
  });

  return router;
}