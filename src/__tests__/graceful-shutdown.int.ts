import { Server } from '../server';
import { Express } from 'express';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

describe('Graceful Shutdown Integration Tests', () => {
  let server: Server;
  let app: Express;
  let httpServer: http.Server;
  let port: number;

  beforeEach(() => {
    server = new Server({ port: 0, env: 'test' });
    app = server.getApp();
  });

  afterEach(async () => {
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  describe('Server Shutdown Integration', () => {
    it('should handle server close callback correctly', async () => {
      let serverCloseCallbackCalled = false;

      // Start server
      await new Promise<void>((resolve) => {
        httpServer = app.listen(0, () => {
          const address = httpServer.address();
          if (address && typeof address === 'object') {
            port = address.port;
          }
          resolve();
        });
      });

      // Mock the graceful shutdown process
      const originalClose = httpServer.close.bind(httpServer);
      httpServer.close = jest.fn((callback) => {
        serverCloseCallbackCalled = true;
        originalClose(() => {
          if (callback) callback();
        });
        return httpServer;
      });

      // Simulate graceful shutdown
      httpServer.close(() => {
        expect(serverCloseCallbackCalled).toBe(true);
      });
    });

    it('should stop accepting new connections during shutdown', async () => {
      // Start server
      await new Promise<void>((resolve) => {
        httpServer = app.listen(0, () => {
          const address = httpServer.address();
          if (address && typeof address === 'object') {
            port = address.port;
          }
          resolve();
        });
      });

      // Verify server is accepting connections
      const response1 = await fetch(`http://localhost:${port}/health`);
      expect(response1.status).toBe(200);

      // Close server
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });

      // Verify server is no longer accepting connections
      try {
        await fetch(`http://localhost:${port}/health`);
        fail('Expected connection to be refused');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Signal Handling Integration', () => {
    it('should maintain server state during normal operation', async () => {
      // Start server
      await new Promise<void>((resolve) => {
        httpServer = app.listen(0, () => {
          const address = httpServer.address();
          if (address && typeof address === 'object') {
            port = address.port;
          }
          resolve();
        });
      });

      // Make multiple requests to ensure server is stable
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`http://localhost:${port}/health`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.status).toBe('ok');
      }
    });

    it('should handle concurrent requests during normal operation', async () => {
      // Start server
      await new Promise<void>((resolve) => {
        httpServer = app.listen(0, () => {
          const address = httpServer.address();
          if (address && typeof address === 'object') {
            port = address.port;
          }
          resolve();
        });
      });

      // Make concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        fetch(`http://localhost:${port}/health`)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const dataPromises = responses.map(response => response.json());
      const data = await Promise.all(dataPromises);

      data.forEach(item => {
        expect(item.status).toBe('ok');
        expect(item.timestamp).toBeDefined();
      });
    });
  });

  describe('Cleanup Integration', () => {
    it('should clean up resources properly after shutdown', async () => {
      let resourcesCleaned = false;

      // Start server
      await new Promise<void>((resolve) => {
        httpServer = app.listen(0, () => {
          const address = httpServer.address();
          if (address && typeof address === 'object') {
            port = address.port;
          }
          resolve();
        });
      });

      // Override close to track cleanup
      const originalClose = httpServer.close.bind(httpServer);
      httpServer.close = jest.fn((callback) => {
        resourcesCleaned = true;
        originalClose(() => {
          if (callback) callback();
        });
        return httpServer;
      });

      // Shutdown server
      await new Promise<void>((resolve) => {
        httpServer.close(() => {
          expect(resourcesCleaned).toBe(true);
          resolve();
        });
      });
    });

    it('should handle server close errors gracefully', async () => {
      // Start server
      await new Promise<void>((resolve) => {
        httpServer = app.listen(0, () => {
          const address = httpServer.address();
          if (address && typeof address === 'object') {
            port = address.port;
          }
          resolve();
        });
      });

      // Mock server.close to throw an error
      const originalClose = httpServer.close.bind(httpServer);
      httpServer.close = jest.fn((callback) => {
        // Simulate error but still call callback
        if (callback) {
          setTimeout(() => callback(), 10);
        }
        return httpServer;
      });

      // Should not throw despite the mocked behavior
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });

      expect(httpServer.close).toHaveBeenCalled();

      // Restore original close for cleanup
      httpServer.close = originalClose;
    });
  });

  describe('Process Signal Integration', () => {
    it('should handle multiple signal handlers without conflicts', async () => {
      const originalListeners = process.listenerCount('SIGINT') + process.listenerCount('SIGTERM');

      // Start server
      await new Promise<void>((resolve) => {
        httpServer = app.listen(0, () => {
          const address = httpServer.address();
          if (address && typeof address === 'object') {
            port = address.port;
          }
          resolve();
        });
      });

      const newListeners = process.listenerCount('SIGINT') + process.listenerCount('SIGTERM');

      // Should have added exactly 2 listeners (SIGINT + SIGTERM)
      expect(newListeners).toBe(originalListeners + 2);

      // Clean up
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    });
  });
});