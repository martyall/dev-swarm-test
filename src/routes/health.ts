import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

interface HealthResponse {
  status: string;
  timestamp: string;
}

router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const healthData: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString()
  };

  res.status(200).json(healthData);
}));

export { router as healthRouter };