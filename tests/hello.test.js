const { hello } = require('../src/hello');

describe('hello function', () => {
  describe('return value', () => {
    it('should return correct hello world string', () => {
      const result = hello();
      expect(result).toBe('Hello, World!');
    });
  });

  describe('export availability', () => {
    it('should export hello function as named export', () => {
      expect(typeof hello).toBe('function');
      expect(hello).toBeDefined();
    });
  });
});