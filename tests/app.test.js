describe('app.js', () => {
  it('should import hello function without errors', () => {
    expect(() => {
      require('../src/app');
    }).not.toThrow();
  });
});