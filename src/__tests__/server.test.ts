import { Server, ServerConfig } from '../server';
import { Express } from 'express';

describe('Server Unit Tests', () => {
  let server: Server;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create server with default configuration', () => {
      server = new Server();
      const config = server.getConfig();

      expect(config.port).toBe(3000);
      expect(config.env).toBe('development');
    });

    it('should create server with custom port configuration', () => {
      const customConfig: Partial<ServerConfig> = { port: 8080 };
      server = new Server(customConfig);
      const config = server.getConfig();

      expect(config.port).toBe(8080);
      expect(config.env).toBe('development');
    });

    it('should create server with custom environment configuration', () => {
      const customConfig: Partial<ServerConfig> = { env: 'production' };
      server = new Server(customConfig);
      const config = server.getConfig();

      expect(config.port).toBe(3000);
      expect(config.env).toBe('production');
    });

    it('should create server with full custom configuration', () => {
      const customConfig: Partial<ServerConfig> = { port: 5000, env: 'test' };
      server = new Server(customConfig);
      const config = server.getConfig();

      expect(config.port).toBe(5000);
      expect(config.env).toBe('test');
    });
  });

  describe('Environment Variable Handling', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use PORT environment variable when available', () => {
      process.env.PORT = '9000';
      server = new Server();
      const config = server.getConfig();

      expect(config.port).toBe(9000);
    });

    it('should use NODE_ENV environment variable when available', () => {
      process.env.NODE_ENV = 'staging';
      server = new Server();
      const config = server.getConfig();

      expect(config.env).toBe('staging');
    });

    it('should prioritize constructor config over environment variables', () => {
      process.env.PORT = '9000';
      process.env.NODE_ENV = 'staging';

      const customConfig: Partial<ServerConfig> = { port: 7000, env: 'test' };
      server = new Server(customConfig);
      const config = server.getConfig();

      expect(config.port).toBe(7000);
      expect(config.env).toBe('test');
    });
  });

  describe('Express App Configuration', () => {
    it('should return Express app instance', () => {
      server = new Server();
      const app = server.getApp();

      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should configure app with middleware', () => {
      server = new Server();
      const app = server.getApp();

      // Check that the app has middleware stack
      expect(app._router).toBeDefined();
      expect(app._router.stack.length).toBeGreaterThan(0);
    });
  });

  describe('Port Configuration Validation', () => {
    it('should handle string port from environment', () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, PORT: '4000' };

      server = new Server();
      const config = server.getConfig();

      expect(config.port).toBe(4000);
      expect(typeof config.port).toBe('number');

      process.env = originalEnv;
    });

    it('should handle invalid port string gracefully', () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, PORT: 'invalid' };

      server = new Server();
      const config = server.getConfig();

      expect(config.port).toBe(3000); // Should fallback to default

      process.env = originalEnv;
    });
  });
});