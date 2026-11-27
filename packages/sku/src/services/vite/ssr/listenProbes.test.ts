import type { Server } from 'node:http';
import type net from 'node:net';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { RequestHandler } from 'express';
import { listen, type RenderFunction } from './listen.js';

const portOf = (server: net.Server) => {
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected a TCP server address');
  }
  return address.port;
};

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

const probe = async (url: string, method = 'GET') => {
  const response = await fetch(url, { method });
  return {
    status: response.status,
    contentType: response.headers.get('content-type'),
    cacheControl: response.headers.get('cache-control'),
    allow: response.headers.get('allow'),
    body: await response.text(),
  };
};

const unavailable = {
  status: 503,
  contentType: 'text/plain; charset=utf-8',
  cacheControl: 'no-store',
  allow: null,
  body: 'unavailable',
};
const ok = {
  status: 200,
  contentType: 'text/plain; charset=utf-8',
  cacheControl: 'no-store',
  allow: null,
  body: 'ok',
};
const methodNotAllowed = {
  status: 405,
  contentType: 'text/plain; charset=utf-8',
  cacheControl: 'no-store',
  allow: 'GET, HEAD',
  body: '',
};

const recordingApp =
  (seen: string[]): RequestHandler =>
  (req, res) => {
    seen.push(`${req.method} ${req.path}`);
    res.status(418).type('text/plain').send('app');
  };

const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'] as const;

const spyOnConsole = () =>
  consoleMethods.map((method) =>
    vi.spyOn(console, method).mockImplementation(() => {}),
  );

const assertNoLeakedSignalListeners = () => {
  if (
    process.listenerCount('SIGTERM') !== 0 ||
    process.listenerCount('SIGINT') !== 0
  ) {
    throw new Error(
      `Signal listeners leaked: SIGTERM ${process.listenerCount('SIGTERM')}, SIGINT ${process.listenerCount('SIGINT')}`,
    );
  }
};

describe('listen probes', () => {
  const servers: Array<{
    httpServer: { close: (callback?: (err?: Error) => void) => void };
  }> = [];
  let clientDirectory: string | undefined;

  afterEach(async () => {
    for (const { httpServer } of servers.splice(0)) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    }
    if (clientDirectory) {
      await rm(clientDirectory, { recursive: true, force: true });
      clientDirectory = undefined;
    }
    assertNoLeakedSignalListeners();
  });

  it('reports /livez ok and /readyz unavailable during onListen and logs readiness transition', async () => {
    const logs = spyOnConsole();
    const seen: string[] = [];
    let during: unknown[] = [];

    const result = await listen({
      ...baseListenOptions,
      port: 0,
      onListen: async ({ port }) => {
        const originDuring = `http://127.0.0.1:${port}`;
        during = [
          await probe(`${originDuring}/livez`),
          await probe(`${originDuring}/livez`, 'HEAD'),
          await probe(`${originDuring}/readyz`),
          await probe(`${originDuring}/readyz`, 'HEAD'),
        ];
      },
      middleware: [recordingApp(seen)],
    });
    servers.push(result);

    expect(during).toEqual([
      ok,
      { ...ok, body: '' },
      unavailable,
      { ...unavailable, body: '' },
    ]);
    expect(seen).toEqual([]);
    expect(logs.flatMap((log) => log.mock.calls)).toEqual([
      ['readiness starting -> ready'],
    ]);
  });

  it('answers /livez and /readyz before static files', async () => {
    clientDirectory = await mkdtemp(path.join(tmpdir(), 'sku-ssr-static-'));
    await writeFile(path.join(clientDirectory, 'livez'), 'static-livez');
    await writeFile(path.join(clientDirectory, 'readyz'), 'static-readyz');

    const seen: string[] = [];
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      publicPath: '/',
      clientDirectory,
      middleware: [recordingApp(seen)],
    });
    servers.push(result);

    const origin = `http://127.0.0.1:${portOf(result.httpServer)}`;
    expect(await probe(`${origin}/livez`)).toEqual(ok);
    expect(await probe(`${origin}/readyz`)).toEqual(ok);
    expect(seen).toEqual([]);
  });
});

describe('listen probe routes', () => {
  const seen: string[] = [];
  let logs: ReturnType<typeof spyOnConsole> = [];
  let httpServer: Server | undefined;
  let origin: string;

  beforeAll(async () => {
    const startupLogs = spyOnConsole();
    try {
      const result = await listen({
        ...baseListenOptions,
        port: 0,
        middleware: [recordingApp(seen)],
      });
      httpServer = result.httpServer;
      origin = `http://127.0.0.1:${portOf(result.httpServer)}`;
    } finally {
      for (const log of startupLogs) {
        log.mockRestore();
      }
    }
  });

  beforeEach(() => {
    seen.length = 0;
    logs = spyOnConsole();
  });

  afterAll(async () => {
    if (httpServer) {
      const server = httpServer;
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      httpServer = undefined;
    }
    assertNoLeakedSignalListeners();
  });

  it.each([
    ['GET', '/livez', ok],
    ['HEAD', '/livez', { ...ok, body: '' }],
    ['GET', '/livez/', ok],
    ['GET', '/readyz', ok],
    ['HEAD', '/readyz', { ...ok, body: '' }],
    ['GET', '/readyz/', ok],
    ['POST', '/livez', methodNotAllowed],
    ['PUT', '/readyz', methodNotAllowed],
  ] as const)(
    'serves %s %s ahead of app middleware without logging',
    async (method, pathname, expected) => {
      expect(await probe(`${origin}${pathname}`, method)).toEqual(expected);
      expect(seen).toEqual([]);
      for (const log of logs) {
        expect(log).not.toHaveBeenCalled();
      }
    },
  );

  it.each([
    '/health',
    '/healthz',
    '/startupz',
    '/ready',
    '/livez/other',
    '/readyz/other',
  ])(
    'passes GET %s through to app middleware without logging',
    async (pathname) => {
      expect(await probe(`${origin}${pathname}`)).toMatchObject({
        status: 418,
        body: 'app',
      });
      expect(seen).toEqual([`GET ${pathname}`]);
      for (const log of logs) {
        expect(log).not.toHaveBeenCalled();
      }
    },
  );
});
