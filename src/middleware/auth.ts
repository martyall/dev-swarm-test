import { Request, Response, NextFunction } from 'express';
import { validateToken, extractTokenFromHeader, UserPayload } from '../utils/jwt';

/**
 * Extend Express Request interface to include user data
 */
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Authentication middleware that validates JWT tokens
 * Protects routes by ensuring valid authentication tokens are provided
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 *
 * @example
 * app.get('/protected', authMiddleware, (req, res) => {
 *   res.json({ message: 'Access granted', user: req.user });
 * });
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Access denied. No token provided or invalid token format.'
      });
      return;
    }

    const user = validateToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: `Access denied. Invalid token: ${error.message}`
    });
  }
}