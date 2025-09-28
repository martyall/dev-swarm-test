const { hello } = require('../src/app');

describe('app.js', () => {
  it('should import hello function without errors', () => {
    expect(hello).toBeDefined();
    expect(typeof hello).toBe('function');
    expect(hello()).toBe('Hello, World!');
  });
});