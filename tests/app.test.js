describe('app.js', () => {
  it('should import hello function successfully', () => {
    expect(() => {
      const { hello } = require('../src/hello');
      expect(hello).toBeDefined();
      expect(typeof hello).toBe('function');
    }).not.toThrow();
  });
});