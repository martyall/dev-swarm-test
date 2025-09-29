import app from '../../src/index';

describe('App', () => {
  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should be an Express application', () => {
    expect(typeof app).toBe('function');
    expect(app.listen).toBeDefined();
  });
});