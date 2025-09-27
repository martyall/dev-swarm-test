const { greet } = require('../src/app');

describe('app.js module', () => {
    test('should import hello function from hello.js without errors', () => {
        // This test verifies that app.js can successfully import the hello function
        // If there were import errors, the module loading would fail
        expect(() => {
            require('../src/app');
        }).not.toThrow();

        // Verify that greet function works (implying hello import was successful)
        const result = greet('Test');
        expect(result).toContain('Hello, World!');
    });

    test('should return personalized greeting with provided name', () => {
        const name = 'Alice';
        const result = greet(name);
        expect(result).toBe('Hello, World! Nice to meet you, Alice!');

        // Test with different name to ensure dynamic behavior
        const result2 = greet('Bob');
        expect(result2).toBe('Hello, World! Nice to meet you, Bob!');
    });

    test('should export greet function successfully', () => {
        expect(typeof greet).toBe('function');
        expect(greet).toBeDefined();

        // Verify the greet function can be called and returns a string
        const result = greet('TestUser');
        expect(typeof result).toBe('string');
    });
});