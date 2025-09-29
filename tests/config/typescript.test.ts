import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

describe('TypeScript Configuration', () => {
  describe('should enforce strict TypeScript compilation', () => {
    it('should enforce strict TypeScript compilation', () => {
      // Verify tsconfig.json exists
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);

      // Read and parse tsconfig.json
      const tsconfig = require('../../tsconfig.json');

      // Verify strict mode is enabled
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.strict).toBe(true);

      // Verify other strict-related options are configured
      expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
      expect(tsconfig.compilerOptions.strictNullChecks).toBe(true);
      expect(tsconfig.compilerOptions.strictFunctionTypes).toBe(true);
      expect(tsconfig.compilerOptions.noImplicitReturns).toBe(true);
      expect(tsconfig.compilerOptions.noFallthroughCasesInSwitch).toBe(true);

      // Verify Node.js compatibility settings
      expect(tsconfig.compilerOptions.target).toBeDefined();
      expect(tsconfig.compilerOptions.module).toBeDefined();
      expect(tsconfig.compilerOptions.moduleResolution).toBe('node');
      expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
      expect(tsconfig.compilerOptions.allowSyntheticDefaultImports).toBe(true);
    });

    it('should compile TypeScript code with strict checking', () => {
      // Create a temporary TypeScript file with type issues that should fail in strict mode
      const testFilePath = path.resolve(process.cwd(), 'temp-strict-test.ts');
      const fs = require('fs');

      // Write a TypeScript file with code that should fail strict checking
      const strictTestCode = `
// This should fail with strict checking
let implicitAny;
function noReturnType(x) {
  if (x > 0) {
    return x;
  }
  // Missing return for else case - should fail with noImplicitReturns
}

// This should pass with proper typing
const properlyTyped: string = "hello";
export { properlyTyped };
`;

      fs.writeFileSync(testFilePath, strictTestCode);

      try {
        // Try to compile the test file - this should fail due to strict checking
        execSync(`npx tsc ${testFilePath} --noEmit`, { stdio: 'pipe' });
        fail('Expected TypeScript compilation to fail with strict checking, but it passed');
      } catch (error) {
        // Compilation should fail - this is expected with strict mode
        expect(error).toBeDefined();
        const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';

        // Verify we get strict-mode related errors
        expect(
          errorOutput.includes('implicitly has an \'any\' type') ||
          errorOutput.includes('Not all code paths return a value') ||
          errorOutput.includes('Parameter') && errorOutput.includes('implicitly has an \'any\' type')
        ).toBe(true);
      } finally {
        // Clean up the temporary file
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });
});