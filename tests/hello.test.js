const { hello } = require('../src/hello.js');

describe('hello function', () => {
  it("should return 'Hello, World!' when called", () => {
    const result = hello();
    expect(result).toBe("Hello, World!");
  });
});