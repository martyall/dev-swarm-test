import express from 'express';
import request from 'supertest';
import morgan from 'morgan';
import { logger } from '../../src/utils/logger';

describe('Morgan Middleware Integration', () => {
  let app: express.Application;
  let originalLog: jest.SpyInstance;
  let originalStdoutWrite: jest.SpyInstance;

  beforeEach(() => {
    originalLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    originalStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    app = express();
  });

  afterEach(() => {
    originalLog.mockRestore();
    originalStdoutWrite.mockRestore();
  });

  it('should generate Morgan logs for HTTP requests', async () => {
    // Setup Morgan middleware directly in test
    app.use(morgan('combined'));

    app.get('/test', (req, res) => {
      res.json({ message: 'test' });
    });

    await request(app)
      .get('/test')
      .expect(200);

    // Morgan should have written to stdout
    expect(originalStdoutWrite).toHaveBeenCalled();
    const writeCalls = originalStdoutWrite.mock.calls;
    const morganLogFound = writeCalls.some(call =>
      call[0] && typeof call[0] === 'string' && call[0].includes('GET /test')
    );
    expect(morganLogFound).toBe(true);
  });

  it('should forward Morgan logs to ts-log output', async () => {
    // Create a custom stream that forwards to ts-log
    const stream = {
      write: (message: string) => {
        logger.info('HTTP Request:', message.trim());
      }
    };

    app.use(morgan('combined', { stream }));

    app.get('/test', (req, res) => {
      res.json({ message: 'test' });
    });

    await request(app)
      .get('/test')
      .expect(200);

    // Verify that ts-log received the Morgan log
    expect(originalLog).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] HTTP Request:'),
      expect.stringContaining('GET /test')
    );
  });
});