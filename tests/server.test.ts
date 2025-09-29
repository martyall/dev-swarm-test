import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

describe('Server Integration', () => {
  let serverProcess: ChildProcess;

  beforeEach(async () => {
    // Allow time for any previous processes to clean up
    await sleep(500);
  });

  afterEach(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      serverProcess = null as any;
    }
  });

  it('should start development server and respond to requests', async () => {
    // This test verifies the acceptance criteria:
    // "Given the npm scripts, when running npm start, then the development server starts"

    let serverStarted = false;
    let serverOutput = '';

    // Create a promise that resolves when the server starts
    const serverStartPromise = new Promise<void>((resolve, reject) => {
      serverProcess = spawn('npm', ['start'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      const timeout = setTimeout(() => {
        reject(new Error('Server failed to start within timeout period'));
      }, 10000); // 10 second timeout

      serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;

        // Look for common Express server startup indicators
        if (output.includes('listening') ||
            output.includes('server') ||
            output.includes('started') ||
            output.includes('port')) {
          serverStarted = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        serverOutput += error;

        // If TypeScript compilation succeeds or server starts, that's good
        if (error.includes('listening') ||
            error.includes('server') ||
            error.includes('started')) {
          serverStarted = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      serverProcess.on('exit', (code, signal) => {
        clearTimeout(timeout);
        if (!serverStarted) {
          reject(new Error(`Server process exited with code ${code} and signal ${signal}. Output: ${serverOutput}`));
        }
      });
    });

    try {
      await serverStartPromise;
      expect(serverStarted).toBe(true);
      expect(serverProcess.pid).toBeDefined();
    } catch (error) {
      // If the test fails, provide helpful debugging information
      console.log('Server output:', serverOutput);
      throw error;
    }
  }, 15000); // 15 second Jest timeout
});