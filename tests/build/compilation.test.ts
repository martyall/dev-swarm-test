import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

describe('TypeScript Compilation', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const distDir = path.join(projectRoot, 'dist');

  beforeEach(() => {
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  });

  it('should compile TypeScript to JavaScript successfully', async () => {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

    expect(fs.existsSync(tsconfigPath)).toBe(true);

    try {
      const { stdout, stderr } = await execAsync('npx tsc', {
        cwd: projectRoot,
        timeout: 10000
      });

      expect(stderr).toBe('');

      expect(fs.existsSync(distDir)).toBe(true);

      const stats = fs.statSync(distDir);
      expect(stats.isDirectory()).toBe(true);
    } catch (error) {
      if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
        console.error('TypeScript compilation failed:');
        console.error('stdout:', (error as any).stdout);
        console.error('stderr:', (error as any).stderr);
      }
      throw error;
    }
  });
});