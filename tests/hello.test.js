const { hello } = require('../src/hello.js');

describe('hello function', () => {
  it("should return 'Hello, World!' when called", () => {
    const result = hello();
    expect(result).toBe("Hello, World!");
  });

  it('should export hello function successfully', () => {
    // Test that the function can be imported
    expect(typeof hello).toBe('function');

    // Test that the module exports are accessible
    const helloModule = require('../src/hello.js');
    expect(helloModule).toHaveProperty('hello');
    expect(typeof helloModule.hello).toBe('function');
  });
});