import { logger } from '../../src/utils/logger';

describe('Server Lifecycle', () => {
  let originalLog: jest.SpyInstance;

  beforeEach(() => {
    originalLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    originalLog.mockRestore();
  });

  it('should generate proper startup and shutdown logs', () => {
    logger.info('Server starting on port 3000');
    logger.info('Server ready to accept connections');
    logger.info('Gracefully shutting down server');
    logger.info('Server shutdown complete');

    expect(originalLog).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Server starting on port 3000')
    );
    expect(originalLog).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Server ready to accept connections')
    );
    expect(originalLog).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Gracefully shutting down server')
    );
    expect(originalLog).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Server shutdown complete')
    );
  });
});