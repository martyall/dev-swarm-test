const hello = require('../src/hello.js');

describe('hello', () => {
  describe('should return \'Hello, World!\' when hello function is called', () => {
    it('should return \'Hello, World!\' when hello function is called', () => {
      const result = hello();
      expect(result).toBe('Hello, World!');
    });
  });

  describe('should export hello function using module.exports', () => {
    it('should export hello function using module.exports', () => {
      expect(typeof hello).toBe('function');
      expect(hello).toBeDefined();
    });
  });
});