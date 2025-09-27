describe('hello', () => {
  describe('should return \'Hello, World!\' when called', () => {
    it('should return \'Hello, World!\' when called', () => {
      const { hello } = require('../src/hello.js');
      const result = hello();
      expect(result).toBe('Hello, World!');
    });
  });

  describe('should be importable as ES6 module', () => {
    it('should be importable as ES6 module', () => {
      expect(() => {
        const { hello } = require('../src/hello.js');
        expect(typeof hello).toBe('function');
      }).not.toThrow();
    });
  });
});