const { greet } = require('../src/app');

describe('app.js', () => {
  describe('hello function import', () => {
    it('should import hello function from hello.js without errors', () => {
      // Test that the module can be required without throwing errors
      expect(() => {
        require('../src/app');
      }).not.toThrow();

      // Test that greet function is defined and can be called
      expect(greet).toBeDefined();
      expect(typeof greet).toBe('function');
    });
  });

  describe('greet function', () => {
    it('should export greet function correctly', () => {
      // Test that greet function is properly exported
      expect(greet).toBeDefined();
      expect(typeof greet).toBe('function');

      // Test that the module exports contain greet
      const appModule = require('../src/app');
      expect(appModule.greet).toBeDefined();
      expect(appModule.greet).toBe(greet);
    });

    it('should return correct greeting format with custom name', () => {
      // Mock the hello function to return expected value
      jest.doMock('../src/hello', () => ({
        hello: () => 'Hello, World!'
      }));

      // Re-require to get mocked version
      const { greet: mockedGreet } = require('../src/app');

      // Test the greeting format
      const result = mockedGreet('Alice');
      expect(result).toBe('Hello, World! Nice to meet you, Alice!');

      // Test with different name
      const result2 = mockedGreet('Bob');
      expect(result2).toBe('Hello, World! Nice to meet you, Bob!');
    });
  });
});