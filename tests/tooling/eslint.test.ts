import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('ESLint Configuration', () => {
  const testFilePath = join(process.cwd(), 'test-eslint.ts');

  afterEach(() => {
    // Clean up test files
    try {
      unlinkSync(testFilePath);
    } catch {
      // File might not exist, ignore error
    }
  });

  test('should detect and report ESLint rule violations', () => {
    // Create a TypeScript file with ESLint rule violations
    const codeWithViolations = `var unused = 'this should be const';
var anotherUnused = 'never used';
let shouldBeConst = 'this should be const too';

function testFunction() {
  console.log('this triggers no-console warning');
  return undefined;
}

// Unused function
function unusedFunction() {
  return 'never called';
}

export { testFunction };`;

    // Write the code with violations to a test file
    writeFileSync(testFilePath, codeWithViolations);

    // Run ESLint on the test file and capture output
    let eslintOutput = '';
    let eslintExitCode = 0;

    try {
      eslintOutput = execSync(`npx eslint ${testFilePath}`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error: any) {
      // ESLint returns non-zero exit code when violations are found
      eslintOutput = error.stdout || error.message;
      eslintExitCode = error.status;
    }

    // Verify that ESLint detected violations
    expect(eslintExitCode).not.toBe(0);
    expect(eslintOutput).toContain(testFilePath);

    // Verify specific rule violations are detected
    expect(eslintOutput).toContain('no-var'); // var usage
    expect(eslintOutput).toContain('prefer-const'); // should use const
    expect(eslintOutput).toContain('no-console'); // console.log usage
    expect(eslintOutput).toContain('@typescript-eslint/no-unused-vars'); // unused variables

    // Verify the output shows problems were found
    expect(eslintOutput).toMatch(/\d+\s+problem/);
  });
});
