const { hello } = require('../src/hello');

describe('hello', () => {
  describe('should return \'Hello, World!\' when called', () => {
    it('should return \'Hello, World!\' when called', () => {
      const result = hello();
      expect(result).toBe('Hello, World!');
    });
  });

  describe('should export hello function as named export', () => {
    it('should export hello function as named export', () => {
      expect(typeof hello).toBe('function');
    });
  });
});