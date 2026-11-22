import http, { type Server } from 'node:http';
import net, { type Socket } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  listen,
  type RenderFunction,
  type SsrServerOptions,
} from './listen.js';

const baseListenOptions = {
  publicPath: '/static/',
  render: (async () => {
    throw new Error('render should not run in these tests');
  }) as RenderFunction,
  assets: { bootstrapModules: [], css: [], modulePreloads: [] },
  cspEnabled: false,
  cspExtraSources: {},
  cspReportOnlyEnabled: false,
  cspReportOnlyExtraSources: {},
};

const closeServer = (server: Server) =>
  new Promise<void>((resolve, reject) => {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    server.close((error) => {
      if (
        error &&
        (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING'
      ) {
        reject(error);
        return;
      }
      resolve();
    });
  });

const portOf = (server: Server) => (server.address() as net.AddressInfo).port;

const closedWithin = (socket: Socket, ms = 1_000) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('socket stayed open'));
    }, ms);
    socket.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });

const deferred = () => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const mockExit = () =>
  vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

const responseUntilSocketCloses = (port: number, agent: http.Agent) =>
  new Promise<{
    connection: string | string[] | undefined;
    body: string;
  }>((resolve, reject) => {
    const req = http.get(
      { agent, hostname: '127.0.0.1', port, path: '/' },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const finish = () =>
            resolve({
              connection: res.headers.connection,
              body: Buffer.concat(chunks).toString(),
            });
          const socket = req.socket;
          if (!socket || socket.destroyed) {
            finish();
            return;
          }
          socket.on('error', () => {});
          closedWithin(socket).then(finish, reject);
        });
      },
    );
    req.on('error', reject);
  });

const withKeepAlive = async (run: (agent: http.Agent) => Promise<void>) => {
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
  try {
    await run(agent);
  } finally {
    agent.destroy();
  }
};

describe('production server shutdown', () => {
  const servers: Server[] = [];

  const startServer = async (overrides: Partial<SsrServerOptions> = {}) => {
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      middleware: [(_req, res) => res.status(200).end()],
      ...overrides,
    });
    servers.push(result.httpServer);
    return result;
  };

  afterEach(async () => {
    vi.useRealTimers();
    for (const server of servers.splice(0)) {
      await closeServer(server);
    }
    if (process.listenerCount('SIGTERM') !== 0) {
      throw new Error(
        `SIGTERM listeners leaked: ${process.listenerCount('SIGTERM')}`,
      );
    }
  });

  it('sets keep-alive to 35000 and leaves headers timeout at 60000', async () => {
    const { httpServer } = await startServer();

    expect(httpServer.keepAliveTimeout).toBe(35_000);
    expect(httpServer.headersTimeout).toBe(60_000);
    expect(process.listenerCount('SIGTERM')).toBe(1);
  });

  it('keeps an onListen keep-alive that is still below headers timeout', async () => {
    const result = await startServer({
      onListen({ httpServer }) {
        httpServer.keepAliveTimeout = 40_000;
      },
    });

    expect(result.httpServer.keepAliveTimeout).toBe(40_000);
    expect(result.httpServer.headersTimeout).toBe(60_000);
  });

  it('rejects startup when keep-alive meets the headers timeout', async () => {
    await expect(
      startServer({
        onListen({ httpServer }) {
          httpServer.keepAliveTimeout = 60_000;
        },
      }),
    ).rejects.toThrow(/keepAliveTimeout \(60000\)/);
    expect(process.listenerCount('SIGTERM')).toBe(0);
  });

  it('does not reject startup when headers timeout is 0', async () => {
    const result = await startServer({
      onListen({ httpServer }) {
        httpServer.headersTimeout = 0;
        httpServer.keepAliveTimeout = 120_000;
      },
    });

    expect(result.httpServer.headersTimeout).toBe(0);
    expect(result.httpServer.keepAliveTimeout).toBe(120_000);
  });

  it('rejects startup when a SIGTERM listener already exists', async () => {
    function dependencyListener() {}
    process.on('SIGTERM', dependencyListener);
    try {
      await expect(startServer()).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Found 1 SIGTERM listener: dependencyListener. A dependency can register a SIGTERM listener. Move shutdown work to onShutdown. To drop a dependency's listener, call process.removeAllListeners('SIGTERM') in onListen, and call the dependency's cleanup from onShutdown.]`,
      );
    } finally {
      process.removeListener('SIGTERM', dependencyListener);
    }
    expect(process.listenerCount('SIGTERM')).toBe(0);
  });

  it('lets onListen remove a dependency SIGTERM listener before startup continues', async () => {
    process.on('SIGTERM', () => {});
    await startServer({
      onListen() {
        process.removeAllListeners('SIGTERM');
      },
    });

    expect(process.listenerCount('SIGTERM')).toBe(1);
  });

  it('closes an idle keep-alive socket without waiting keepAliveTimeout', async () => {
    const exit = mockExit();
    const { httpServer } = await startServer({
      middleware: [(_req, res) => res.status(200).end('ok')],
    });
    const port = portOf(httpServer);

    await withKeepAlive(async (agent) => {
      const socket = await new Promise<Socket>((resolve, reject) => {
        const req = http.get(
          { agent, hostname: '127.0.0.1', port, path: '/' },
          (res) => {
            res.resume();
            res.on('end', () => {
              if (!req.socket) {
                reject(new Error('missing socket'));
                return;
              }
              resolve(req.socket);
            });
          },
        );
        req.on('error', reject);
      });
      socket.on('error', () => {});
      expect(socket.destroyed).toBe(false);

      const closed = closedWithin(socket);
      process.emit('SIGTERM');
      await closed;
      expect(exit).toHaveBeenCalledWith(0);
    });
  });

  it('closes a connected socket that has sent no bytes', async () => {
    const exit = mockExit();
    const { httpServer } = await startServer();

    const socket = net.connect({
      host: '127.0.0.1',
      port: portOf(httpServer),
    });
    socket.on('error', () => {});
    await new Promise<void>((resolve) => {
      socket.once('connect', () => resolve());
    });

    const closed = closedWithin(socket);
    process.emit('SIGTERM');
    await closed;
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('sends Connection: close when headers are not yet sent, then closes the socket', async () => {
    const exit = mockExit();
    const gate = deferred();
    const entered = deferred();
    const { httpServer } = await startServer({
      middleware: [
        async (_req, res) => {
          entered.resolve();
          await gate.promise;
          res.status(200).type('text/plain').end('hello');
        },
      ],
    });

    await withKeepAlive(async (agent) => {
      const outcome = responseUntilSocketCloses(portOf(httpServer), agent);
      await entered.promise;
      process.emit('SIGTERM');
      gate.resolve();
      await expect(outcome).resolves.toEqual({
        connection: 'close',
        body: 'hello',
      });
      await vi.waitFor(() => {
        expect(exit).toHaveBeenCalledWith(0);
      });
    });
  });

  it('closes the socket when a response that already sent headers finishes', async () => {
    const exit = mockExit();
    const gate = deferred();
    const entered = deferred();
    const { httpServer } = await startServer({
      middleware: [
        async (_req, res) => {
          res.writeHead(200, {
            'Content-Type': 'text/plain',
            Connection: 'keep-alive',
          });
          res.write('partial');
          entered.resolve();
          await gate.promise;
          res.end('tail');
        },
      ],
    });

    await withKeepAlive(async (agent) => {
      const outcome = responseUntilSocketCloses(portOf(httpServer), agent);
      await entered.promise;
      process.emit('SIGTERM');
      gate.resolve();
      await expect(outcome).resolves.toEqual({
        connection: 'keep-alive',
        body: 'partialtail',
      });
      await vi.waitFor(() => {
        expect(exit).toHaveBeenCalledWith(0);
      });
    });
  });

  it('exits 1 at 25 seconds when a response never finishes', async () => {
    const onShutdown = vi.fn();
    const exit = mockExit();
    const entered = deferred();
    const { httpServer } = await startServer({
      onShutdown,
      middleware: [
        () => {
          entered.resolve();
        },
      ],
    });

    const req = http.get(
      {
        hostname: '127.0.0.1',
        port: portOf(httpServer),
        agent: false,
      },
      () => {},
    );
    req.on('error', () => {});
    await entered.promise;

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    process.emit('SIGTERM');
    await vi.advanceTimersByTimeAsync(24_999);
    expect(exit).not.toHaveBeenCalled();
    expect(onShutdown).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(exit).toHaveBeenCalledWith(1);
    expect(onShutdown).not.toHaveBeenCalled();
  });

  it('exits 0 without waiting when the drain finishes early', async () => {
    const onShutdown = vi.fn(async () => {});
    const exit = mockExit();
    await startServer({ onShutdown });

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    process.emit('SIGTERM');
    await vi.advanceTimersByTimeAsync(0);
    expect(onShutdown).toHaveBeenCalledWith();
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);

    await vi.advanceTimersByTimeAsync(25_000);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('runs onShutdown after the response finishes, then exits 0', async () => {
    const order: string[] = [];
    const exit = mockExit();
    const gate = deferred();
    const entered = deferred();
    const { httpServer } = await startServer({
      onShutdown: async () => {
        order.push('onShutdown');
      },
      middleware: [
        async (_req, res) => {
          entered.resolve();
          await gate.promise;
          res.on('finish', () => {
            order.push('response');
          });
          res.end('ok');
        },
      ],
    });

    const pending = fetch(`http://127.0.0.1:${portOf(httpServer)}/`).catch(
      () => undefined,
    );
    await entered.promise;
    process.emit('SIGTERM');
    gate.resolve();
    await pending;
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(0);
    });
    expect(order).toEqual(['response', 'onShutdown']);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('keeps the SIGTERM listener after the server closes while onShutdown runs', async () => {
    const exit = mockExit();
    const flush = deferred();
    const onShutdown = vi.fn(() => flush.promise);
    const { httpServer } = await startServer({ onShutdown });
    const closed = new Promise<void>((resolve) => {
      httpServer.once('close', () => resolve());
    });

    process.emit('SIGTERM');
    await closed;
    expect(onShutdown).toHaveBeenCalledTimes(1);
    expect(process.listenerCount('SIGTERM')).toBe(1);

    process.emit('SIGTERM');
    flush.resolve();
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(0);
    });
    expect(onShutdown).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(process.listenerCount('SIGTERM')).toBe(0);
  });

  it('reports a rejected onShutdown and still exits 0', async () => {
    const exit = mockExit();
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {});
    await startServer({
      onShutdown: async () => {
        throw new Error('flush failed');
      },
    });

    process.emit('SIGTERM');
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(0);
    });
    expect(reported).toHaveBeenCalledWith(expect.any(Error));
    expect(reported.mock.calls[0]?.[0]).toMatchObject({
      message: 'flush failed',
    });
  });
});
