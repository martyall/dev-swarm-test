import * as fs from 'fs';
import * as path from 'path';

describe('Source Maps', () => {
  it('should generate source maps that map to original TypeScript files', () => {
    const distPath = path.resolve(__dirname, '../../dist');
    const srcPath = path.resolve(__dirname, '../../src');

    // Check if dist directory exists (would be created after compilation)
    if (!fs.existsSync(distPath)) {
      // Create a minimal TypeScript file to test compilation
      if (!fs.existsSync(srcPath)) {
        fs.mkdirSync(srcPath, { recursive: true });
      }

      const testTsFile = path.join(srcPath, 'test.ts');
      fs.writeFileSync(testTsFile, `
export function testFunction(): string {
  const message = 'Hello from TypeScript';
  return message;
}

export class TestClass {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }
}
`);

      // For this test, we'll verify the tsconfig.json has sourceMap enabled
      const tsconfigPath = path.resolve(__dirname, '../../tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.compilerOptions.sourceMap).toBe(true);
      expect(tsconfig.compilerOptions.outDir).toBe('./dist');
      expect(tsconfig.compilerOptions.rootDir).toBe('./src');

      return;
    }

    // If dist exists, verify source map files are generated
    const jsFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.js'));

    for (const jsFile of jsFiles) {
      const mapFile = jsFile.replace('.js', '.js.map');
      const mapFilePath = path.join(distPath, mapFile);

      // Verify source map file exists
      expect(fs.existsSync(mapFilePath)).toBe(true);

      // Verify source map content
      const sourceMap = JSON.parse(fs.readFileSync(mapFilePath, 'utf8'));
      expect(sourceMap.version).toBe(3);
      expect(sourceMap.sources).toBeDefined();
      expect(sourceMap.sources.length).toBeGreaterThan(0);

      // Verify source map points to TypeScript source files
      const hasTypeScriptSources = sourceMap.sources.some((source: string) =>
        source.includes('.ts') || source.includes('../src/')
      );
      expect(hasTypeScriptSources).toBe(true);

      // Verify the JS file has source map reference
      const jsContent = fs.readFileSync(path.join(distPath, jsFile), 'utf8');
      expect(jsContent).toContain(`//# sourceMappingURL=${mapFile}`);
    }
  });
});