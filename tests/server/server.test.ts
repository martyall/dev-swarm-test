import express from 'express';
import { logger } from '../../src/utils/logger';

describe('Express Server', () => {
  let originalLog: jest.SpyInstance;
  let app: express.Application;
  let server: any;

  beforeEach(() => {
    originalLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    app = express();
  });

  afterEach(() => {
    originalLog.mockRestore();
    if (server) {
      server.close();
    }
  });

  it('should start Express server successfully with TypeScript', (done) => {
    const port = 0; // Use random available port

    server = app.listen(port, () => {
      const actualPort = server.address()?.port;
      logger.info(`Server running on port ${actualPort}`);

      expect(originalLog).toHaveBeenCalledWith(
        expect.stringContaining(`[INFO] Server running on port ${actualPort}`)
      );
      done();
    });
  });
});