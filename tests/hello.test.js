describe('hello function', () => {
  it('should export hello function that can be imported', () => {
    const { hello } = require('../src/hello');
    expect(typeof hello).toBe('function');
  });

  it("should return 'Hello, World!' when called", () => {
    const { hello } = require('../src/hello');
    const result = hello();
    expect(result).toBe('Hello, World!');
  });
});