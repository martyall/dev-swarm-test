import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('Prettier Configuration', () => {
  const testFilePath = join(process.cwd(), 'test-format.ts');

  afterEach(() => {
    // Clean up test files
    try {
      unlinkSync(testFilePath);
    } catch {
      // File might not exist, ignore error
    }
  });

  test('should format code according to Prettier configuration', () => {
    // Create a poorly formatted TypeScript file
    const unformattedCode = `const   example={
  property1    :    "value1"  ,
property2:"value2"
    };


function    test (   param1  :  string,param2:number   )   :   void{
    console.log(param1,param2)
}`;

    // Write the unformatted code to a test file
    writeFileSync(testFilePath, unformattedCode);

    // Run the format command
    try {
      execSync('npm run format', { stdio: 'inherit' });
    } catch {
      throw new Error('Format command failed to execute');
    }

    // Read the formatted code
    const formattedCode = readFileSync(testFilePath, 'utf8');

    // Verify the code has been properly formatted
    expect(formattedCode).not.toBe(unformattedCode);
    expect(formattedCode).toContain('const example = {');
    expect(formattedCode).toContain("property1: 'value1',");
    expect(formattedCode).toContain("property2: 'value2'");
    expect(formattedCode).toContain(
      'function test(param1: string, param2: number): void {'
    );
    expect(formattedCode).toContain('console.log(param1, param2);');

    // Verify proper spacing and structure
    expect(formattedCode.trim()).toMatch(
      /^const example = \{\s+property1: 'value1',\s+property2: 'value2',?\s*\};\s+function test\(param1: string, param2: number\): void \{\s+console\.log\(param1, param2\);\s+\}$/
    );
  });
});
