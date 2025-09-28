const { hello } = require('../src/hello');

describe('hello function', () => {
  it('should return \'Hello, World!\' string', () => {
    const result = hello();
    expect(result).toBe('Hello, World!');
  });

  it('should export hello function that can be imported', () => {
    expect(typeof hello).toBe('function');
    expect(hello).toBeDefined();
  });
});