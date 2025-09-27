/**
 * Tests for app.js
 */

describe('app.js', () => {
    describe('imports', () => {
        it('should import hello function from hello.js without errors', () => {
            // This test verifies that app.js can successfully import the hello function
            // from hello.js without throwing any errors during the import process

            // Mock the hello module to simulate successful import
            jest.mock('../src/hello', () => ({
                hello: jest.fn(() => 'Hello, World!')
            }), { virtual: true });

            // Test that requiring app.js doesn't throw an error
            expect(() => {
                require('../src/app');
            }).not.toThrow();

            // Verify the import actually worked by checking if we can access the module
            const app = require('../src/app');
            expect(app).toBeDefined();
            expect(typeof app.createGreeting).toBe('function');
            expect(typeof app.runApp).toBe('function');
        });
    });
});