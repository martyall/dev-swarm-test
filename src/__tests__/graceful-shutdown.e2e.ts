import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

describe('Graceful Shutdown E2E Tests', () => {
  const testServerScript = `
const { Server } = require('./dist/server.js');

const server = new Server({ port: process.env.TEST_PORT || 3001, env: 'test' });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
server.start().then(() => {
  console.log('TEST_SERVER_STARTED');
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
`;

  let testProcess: ChildProcess;
  let testPort: number;

  beforeAll(async () => {
    // Find an available port
    testPort = 3001 + Math.floor(Math.random() * 1000);

    // Write test server script
    await fs.writeFile(path.join(process.cwd(), 'test-server.js'), testServerScript);
  });

  afterAll(async () => {
    // Clean up test server script
    try {
      await fs.unlink(path.join(process.cwd(), 'test-server.js'));
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  afterEach(() => {
    if (testProcess && !testProcess.killed) {
      testProcess.kill('SIGKILL');
    }
  });

  describe('SIGINT Signal Handling', () => {
    it('should shutdown gracefully when receiving SIGINT', async () => {
      let serverStarted = false;
      let serverShutdown = false;
      let serverClosed = false;

      const promise = new Promise<void>((resolve, reject) => {
        testProcess = spawn('node', ['test-server.js'], {
          env: { ...process.env, TEST_PORT: testPort.toString() },
          stdio: 'pipe'
        });

        testProcess.stdout?.on('data', (data) => {
          const output = data.toString();
          if (output.includes('TEST_SERVER_STARTED')) {
            serverStarted = true;
            // Give server time to fully start
            setTimeout(() => {
              testProcess.kill('SIGINT');
            }, 100);
          }
          if (output.includes('shutting down gracefully')) {
            serverShutdown = true;
          }
          if (output.includes('Server closed')) {
            serverClosed = true;
          }
        });

        testProcess.stderr?.on('data', (data) => {
          console.error('Server error:', data.toString());
        });

        testProcess.on('exit', (code, signal) => {
          if (serverStarted && serverShutdown && serverClosed) {
            expect(code).toBe(0);
            resolve();
          } else {
            reject(new Error(`Server didn't shutdown gracefully. Started: ${serverStarted}, Shutdown: ${serverShutdown}, Closed: ${serverClosed}`));
          }
        });

        testProcess.on('error', (error) => {
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Test timed out'));
        }, 10000);
      });

      await promise;
    }, 15000);

    it('should handle health check requests before shutdown', async () => {
      let serverStarted = false;

      const promise = new Promise<void>((resolve, reject) => {
        testProcess = spawn('node', ['test-server.js'], {
          env: { ...process.env, TEST_PORT: testPort.toString() },
          stdio: 'pipe'
        });

        testProcess.stdout?.on('data', async (data) => {
          const output = data.toString();
          if (output.includes('TEST_SERVER_STARTED') && !serverStarted) {
            serverStarted = true;

            try {
              // Make a health check request
              const response = await fetch(`http://localhost:${testPort}/health`);
              expect(response.status).toBe(200);

              const healthData = await response.json();
              expect(healthData.status).toBe('ok');

              // Now send SIGINT
              testProcess.kill('SIGINT');
            } catch (error) {
              reject(error);
            }
          }
        });

        testProcess.on('exit', (code) => {
          expect(code).toBe(0);
          resolve();
        });

        testProcess.on('error', (error) => {
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Test timed out'));
        }, 10000);
      });

      await promise;
    }, 15000);
  });

  describe('SIGTERM Signal Handling', () => {
    it('should shutdown gracefully when receiving SIGTERM', async () => {
      let serverStarted = false;
      let serverShutdown = false;
      let serverClosed = false;

      const promise = new Promise<void>((resolve, reject) => {
        testProcess = spawn('node', ['test-server.js'], {
          env: { ...process.env, TEST_PORT: testPort.toString() },
          stdio: 'pipe'
        });

        testProcess.stdout?.on('data', (data) => {
          const output = data.toString();
          if (output.includes('TEST_SERVER_STARTED')) {
            serverStarted = true;
            // Give server time to fully start
            setTimeout(() => {
              testProcess.kill('SIGTERM');
            }, 100);
          }
          if (output.includes('shutting down gracefully')) {
            serverShutdown = true;
          }
          if (output.includes('Server closed')) {
            serverClosed = true;
          }
        });

        testProcess.stderr?.on('data', (data) => {
          console.error('Server error:', data.toString());
        });

        testProcess.on('exit', (code, signal) => {
          if (serverStarted && serverShutdown && serverClosed) {
            expect(code).toBe(0);
            resolve();
          } else {
            reject(new Error(`Server didn't shutdown gracefully. Started: ${serverStarted}, Shutdown: ${serverShutdown}, Closed: ${serverClosed}`));
          }
        });

        testProcess.on('error', (error) => {
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Test timed out'));
        }, 10000);
      });

      await promise;
    }, 15000);
  });

  describe('Server Availability During Shutdown', () => {
    it('should stop accepting new connections after receiving shutdown signal', async () => {
      let serverStarted = false;
      let connectionRefused = false;

      const promise = new Promise<void>((resolve, reject) => {
        testProcess = spawn('node', ['test-server.js'], {
          env: { ...process.env, TEST_PORT: testPort.toString() },
          stdio: 'pipe'
        });

        testProcess.stdout?.on('data', async (data) => {
          const output = data.toString();
          if (output.includes('TEST_SERVER_STARTED') && !serverStarted) {
            serverStarted = true;

            try {
              // Verify server is accessible
              const response = await fetch(`http://localhost:${testPort}/health`);
              expect(response.status).toBe(200);

              // Send shutdown signal
              testProcess.kill('SIGTERM');

              // Wait a moment for shutdown to begin
              await new Promise(resolve => setTimeout(resolve, 200));

              // Try to make another request - should fail
              try {
                await fetch(`http://localhost:${testPort}/health`, {
                  signal: AbortSignal.timeout(1000)
                });
              } catch (error) {
                connectionRefused = true;
              }
            } catch (error) {
              reject(error);
            }
          }
        });

        testProcess.on('exit', (code) => {
          if (connectionRefused) {
            expect(code).toBe(0);
            resolve();
          } else {
            reject(new Error('Server should have refused new connections after shutdown signal'));
          }
        });

        testProcess.on('error', (error) => {
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Test timed out'));
        }, 10000);
      });

      await promise;
    }, 15000);
  });

  describe('Multiple Signal Handling', () => {
    it('should handle multiple SIGINT signals gracefully', async () => {
      let serverStarted = false;
      let shutdownCount = 0;

      const promise = new Promise<void>((resolve, reject) => {
        testProcess = spawn('node', ['test-server.js'], {
          env: { ...process.env, TEST_PORT: testPort.toString() },
          stdio: 'pipe'
        });

        testProcess.stdout?.on('data', (data) => {
          const output = data.toString();
          if (output.includes('TEST_SERVER_STARTED') && !serverStarted) {
            serverStarted = true;
            // Send first SIGINT
            testProcess.kill('SIGINT');
            // Send second SIGINT after a short delay
            setTimeout(() => {
              if (!testProcess.killed) {
                testProcess.kill('SIGINT');
              }
            }, 50);
          }
          if (output.includes('shutting down gracefully')) {
            shutdownCount++;
          }
        });

        testProcess.on('exit', (code) => {
          // Should only log shutdown message once
          expect(shutdownCount).toBe(1);
          expect(code).toBe(0);
          resolve();
        });

        testProcess.on('error', (error) => {
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Test timed out'));
        }, 10000);
      });

      await promise;
    }, 15000);
  });
});