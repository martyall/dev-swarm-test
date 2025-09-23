import { Server } from '../server';
import { Express } from 'express';

describe('Graceful Shutdown Unit Tests', () => {
  let server: Server;
  let app: Express;

  beforeEach(() => {
    server = new Server({ env: 'test' });
    app = server.getApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Signal Handler Registration', () => {
    it('should register SIGINT signal handler during server start', async () => {
      const processOnSpy = jest.spyOn(process, 'on');
      const listenSpy = jest.spyOn(app, 'listen').mockImplementation(() => {
        const mockServer = {
          close: jest.fn((callback) => callback()),
          address: () => ({ port: 3000 })
        } as any;

        // Simulate server started callback
        setTimeout(() => {
          const callback = listenSpy.mock.calls[0][1];
          if (callback) callback();
        }, 0);

        return mockServer;
      });

      await server.start();

      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

      listenSpy.mockRestore();
      processOnSpy.mockRestore();
    });

    it('should register SIGTERM signal handler during server start', async () => {
      const processOnSpy = jest.spyOn(process, 'on');
      const listenSpy = jest.spyOn(app, 'listen').mockImplementation(() => {
        const mockServer = {
          close: jest.fn((callback) => callback()),
          address: () => ({ port: 3000 })
        } as any;

        setTimeout(() => {
          const callback = listenSpy.mock.calls[0][1];
          if (callback) callback();
        }, 0);

        return mockServer;
      });

      await server.start();

      expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      listenSpy.mockRestore();
      processOnSpy.mockRestore();
    });
  });

  describe('Graceful Shutdown Behavior', () => {
    it('should close server when SIGINT is received', async () => {
      let sigintHandler: Function;
      const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, handler) => {
        if (event === 'SIGINT') {
          sigintHandler = handler as Function;
        }
        return process;
      });

      const mockServerClose = jest.fn((callback) => callback());
      const mockServer = {
        close: mockServerClose,
        address: () => ({ port: 3000 })
      } as any;

      const listenSpy = jest.spyOn(app, 'listen').mockImplementation(() => {
        setTimeout(() => {
          const callback = listenSpy.mock.calls[0][1];
          if (callback) callback();
        }, 0);
        return mockServer;
      });

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await server.start();

      // Simulate SIGINT signal
      expect(() => sigintHandler()).toThrow('process.exit called');
      expect(mockServerClose).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);

      listenSpy.mockRestore();
      processOnSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should close server when SIGTERM is received', async () => {
      let sigtermHandler: Function;
      const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, handler) => {
        if (event === 'SIGTERM') {
          sigtermHandler = handler as Function;
        }
        return process;
      });

      const mockServerClose = jest.fn((callback) => callback());
      const mockServer = {
        close: mockServerClose,
        address: () => ({ port: 3000 })
      } as any;

      const listenSpy = jest.spyOn(app, 'listen').mockImplementation(() => {
        setTimeout(() => {
          const callback = listenSpy.mock.calls[0][1];
          if (callback) callback();
        }, 0);
        return mockServer;
      });

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await server.start();

      // Simulate SIGTERM signal
      expect(() => sigtermHandler()).toThrow('process.exit called');
      expect(mockServerClose).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);

      listenSpy.mockRestore();
      processOnSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });

  describe('Shutdown Logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log shutdown message when SIGINT is received', async () => {
      let sigintHandler: Function;
      const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, handler) => {
        if (event === 'SIGINT') {
          sigintHandler = handler as Function;
        }
        return process;
      });

      const mockServer = {
        close: jest.fn((callback) => callback()),
        address: () => ({ port: 3000 })
      } as any;

      const listenSpy = jest.spyOn(app, 'listen').mockImplementation(() => {
        setTimeout(() => {
          const callback = listenSpy.mock.calls[0][1];
          if (callback) callback();
        }, 0);
        return mockServer;
      });

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await server.start();

      expect(() => sigintHandler()).toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalledWith('\n🛑 Received SIGINT, shutting down gracefully...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Server closed');

      listenSpy.mockRestore();
      processOnSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should log shutdown message when SIGTERM is received', async () => {
      let sigtermHandler: Function;
      const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, handler) => {
        if (event === 'SIGTERM') {
          sigtermHandler = handler as Function;
        }
        return process;
      });

      const mockServer = {
        close: jest.fn((callback) => callback()),
        address: () => ({ port: 3000 })
      } as any;

      const listenSpy = jest.spyOn(app, 'listen').mockImplementation(() => {
        setTimeout(() => {
          const callback = listenSpy.mock.calls[0][1];
          if (callback) callback();
        }, 0);
        return mockServer;
      });

      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await server.start();

      expect(() => sigtermHandler()).toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalledWith('\n🛑 Received SIGTERM, shutting down gracefully...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Server closed');

      listenSpy.mockRestore();
      processOnSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});