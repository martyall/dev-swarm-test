import { generateToken, validateToken } from '../../src/utils/jwt';

describe('JWT Utils', () => {
  const mockUserId = 'user123';
  const mockUserData = { id: mockUserId, email: 'test@example.com' };

  describe('should generate valid JWT tokens', () => {
    it('should generate valid JWT tokens', () => {
      const token = generateToken(mockUserData);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });
  });

  describe('should validate JWT tokens correctly', () => {
    it('should validate JWT tokens correctly', () => {
      const token = generateToken(mockUserData);
      const decoded = validateToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUserData.id);
      expect(decoded.email).toBe(mockUserData.email);
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => validateToken(invalidToken)).toThrow();
    });

    it('should reject expired tokens', () => {
      // Create a token that expires immediately
      const expiredToken = generateToken(mockUserData, '0s');

      // Wait a moment to ensure expiration
      setTimeout(() => {
        expect(() => validateToken(expiredToken)).toThrow();
      }, 100);
    });
  });
});