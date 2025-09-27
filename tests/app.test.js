describe('App', () => {
    describe('hello function import', () => {
        it('should import hello function without errors', () => {
            // Test that app.js exists and can be imported
            expect(() => {
                require('../src/app.js');
            }).not.toThrow();

            // Test that the app module exports the greet function
            const app = require('../src/app.js');
            expect(app.greet).toBeDefined();
            expect(typeof app.greet).toBe('function');
        });
    });
});