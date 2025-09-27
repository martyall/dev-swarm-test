const { hello } = require('../src/hello');

describe('hello function', () => {
    test("should return 'Hello, World!' when called", () => {
        const result = hello();
        expect(result).toBe('Hello, World!');
    });

    test("should export hello function that can be imported", () => {
        expect(typeof hello).toBe('function');
        expect(hello).toBeDefined();
    });
});