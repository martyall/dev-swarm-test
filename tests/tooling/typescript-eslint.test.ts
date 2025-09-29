import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('TypeScript ESLint Configuration', () => {
  const testFilePath = join(process.cwd(), 'test-typescript-eslint.ts');

  afterEach(() => {
    // Clean up test files
    try {
      unlinkSync(testFilePath);
    } catch {
      // File might not exist, ignore error
    }
  });

  test('should detect TypeScript-specific ESLint rule violations', () => {
    // Create a TypeScript file with TypeScript-specific ESLint violations
    const codeWithTypeScriptViolations = `// Missing explicit return type annotation
function missingReturnType(param: string) {
  return param.toUpperCase();
}

// Using any type
function usesAnyType(param: any) {
  return param;
}

// Unused variable with TypeScript type annotation
const unusedTypedVariable: string = 'never used';

// Function without explicit return type that could benefit from it
const arrowFunction = (x: number, y: number) => {
  return x + y;
};

// Interface that's defined but never used
interface UnusedInterface {
  prop: string;
}

export { missingReturnType, usesAnyType };`;

    // Write the code with TypeScript violations to a test file
    writeFileSync(testFilePath, codeWithTypeScriptViolations);

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

    // Verify TypeScript-specific rule violations are detected
    expect(eslintOutput).toContain(
      '@typescript-eslint/explicit-function-return-type'
    ); // missing return type
    expect(eslintOutput).toContain('@typescript-eslint/no-explicit-any'); // using any type
    expect(eslintOutput).toContain('@typescript-eslint/no-unused-vars'); // unused TypeScript variables

    // Verify the output shows problems were found
    expect(eslintOutput).toMatch(/\d+\s+problem/);
  });
});
