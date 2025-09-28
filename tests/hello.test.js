describe('hello', () => {
  describe('should return \'Hello, World!\' when called', () => {
    it('should return \'Hello, World!\' when called', () => {
      const { hello } = require('../src/hello.js');
      expect(hello()).toBe('Hello, World!');
    });
  });

  describe('should export hello function as named export', () => {
    it('should export hello function as named export', () => {
      const helloModule = require('../src/hello.js');
      expect(typeof helloModule.hello).toBe('function');
    });
  });
});