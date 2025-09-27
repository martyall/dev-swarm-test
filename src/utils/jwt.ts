import * as jwt from 'jsonwebtoken';

/**
 * JWT secret key for signing and verifying tokens
 * In production, this should be stored in environment variables
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Default token expiration time
 */
const DEFAULT_EXPIRATION = '24h';

/**
 * User data interface for JWT payload
 */
export interface UserPayload {
  id: string;
  email: string;
  [key: string]: any;
}

/**
 * Generates a JWT token for the given user data
 * @param user - User data to include in the token payload
 * @param expiresIn - Token expiration time (default: 24h)
 * @returns JWT token string
 *
 * @example
 * const token = generateToken({ id: 'user123', email: 'user@example.com' });
 */
export function generateToken(user: UserPayload, expiresIn: string = DEFAULT_EXPIRATION): string {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      ...user
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn,
      issuer: 'your-app-name',
      audience: 'your-app-users'
    });

    return token;
  } catch (error) {
    throw new Error(`Failed to generate token: ${error.message}`);
  }
}

/**
 * Validates and decodes a JWT token
 * @param token - JWT token string to validate
 * @returns Decoded user payload if valid
 * @throws Error if token is invalid or expired
 *
 * @example
 * try {
 *   const user = validateToken(token);
 *   console.log('Valid token for user:', user.email);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 */
export function validateToken(token: string): UserPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'your-app-name',
      audience: 'your-app-users'
    }) as jwt.JwtPayload;

    if (!decoded.id || !decoded.email) {
      throw new Error('Invalid token payload: missing required fields');
    }

    return {
      id: decoded.id,
      email: decoded.email,
      ...decoded
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not active');
    } else {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }
}

/**
 * Extracts token from Authorization header
 * @param authHeader - Authorization header value (format: "Bearer <token>")
 * @returns Token string or null if not found/invalid format
 *
 * @example
 * const token = extractTokenFromHeader(req.headers.authorization);
 * if (token) {
 *   const user = validateToken(token);
 * }
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}