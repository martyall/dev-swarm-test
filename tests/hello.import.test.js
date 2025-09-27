describe('hello module imports', () => {
  it('should be importable using require() and ES6 import syntax', () => {
    // Test CommonJS require syntax
    const { hello: helloRequire } = require('../src/hello.js');
    expect(typeof helloRequire).toBe('function');
    expect(helloRequire()).toBe("Hello, World!");

    // Test that the module exports are accessible
    const helloModule = require('../src/hello.js');
    expect(helloModule).toHaveProperty('hello');
    expect(typeof helloModule.hello).toBe('function');

    // Verify function accessibility and correct return value
    expect(helloModule.hello()).toBe("Hello, World!");
  });
});