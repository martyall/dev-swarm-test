const { greet } = require('../src/app');

describe('app.js', () => {
  describe('hello function import', () => {
    it('should import hello function without errors', () => {
      // Test that the module can be required without throwing errors
      expect(() => {
        require('../src/app');
      }).not.toThrow();

      // Test that greet function is defined and can be called
      expect(greet).toBeDefined();
      expect(typeof greet).toBe('function');
    });
  });
});