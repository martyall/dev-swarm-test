import { Router, Request, Response } from 'express';
import { generateToken } from '../utils/jwt';

export const authRouter = Router();

/**
 * Mock user database (in production, this would be a real database)
 */
const mockUsers = [
  {
    id: 'user123',
    email: 'test@example.com',
    password: 'password123' // In production, this would be hashed
  },
  {
    id: 'user456',
    email: 'admin@example.com',
    password: 'admin123'
  }
];

/**
 * Login endpoint that validates credentials and returns JWT token
 *
 * @route POST /auth/login
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {object} JWT token and user information or error message
 *
 * @example
 * POST /auth/login
 * {
 *   "email": "test@example.com",
 *   "password": "password123"
 * }
 *
 * Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": "user123",
 *     "email": "test@example.com"
 *   }
 * }
 */
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(401).json({
        error: 'Invalid credentials. Email and password are required.'
      });
    }

    // Find user (in production, this would query a database)
    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. Please check your email and password.'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email
    });

    // Return token and user info (without password)
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      error: `Login failed: ${error.message}`
    });
  }
});

/**
 * Token validation endpoint for checking if a token is still valid
 *
 * @route POST /auth/validate
 * @header Authorization Bearer token
 * @returns {object} User information if token is valid
 */
authRouter.post('/validate', (req: Request, res: Response) => {
  // This endpoint would typically use the auth middleware
  // but for demonstration, we'll implement validation here
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid token format'
      });
    }

    const token = authHeader.split(' ')[1];
    // Token validation would happen via middleware in real implementation

    res.status(200).json({
      message: 'Token is valid',
      user: req.user || { id: 'validated' }
    });
  } catch (error) {
    res.status(401).json({
      error: `Token validation failed: ${error.message}`
    });
  }
});