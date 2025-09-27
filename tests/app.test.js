describe('app.js module', () => {
  describe('import functionality', () => {
    it('should import hello function without errors', () => {
      // Test that importing hello function succeeds without errors
      expect(() => {
        const { hello } = require('../src/hello');
        expect(hello).toBeDefined();
        expect(typeof hello).toBe('function');
      }).not.toThrow();
    });
  });

  describe('greet function export', () => {
    it('should export greet function successfully', () => {
      // Test that greet function is available for import
      const { greet } = require('../src/app');

      expect(greet).toBeDefined();
      expect(typeof greet).toBe('function');

      // Verify the greet function works correctly
      const result = greet();
      expect(result).toBe('Hello, World!');
    });
  });
});