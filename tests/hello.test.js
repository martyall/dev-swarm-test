const { hello } = require('../src/hello');

describe('hello function', () => {
  it('should return \'Hello, World!\' when called', () => {
    const result = hello();
    expect(result).toBe('Hello, World!');
  });

  it('should export hello function successfully', () => {
    expect(typeof hello).toBe('function');
  });
});