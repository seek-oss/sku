import { EventEmitter } from 'node:events';
import http, { type Server } from 'node:http';
import net, { type Socket } from 'node:net';
import { Readable } from 'node:stream';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Request, RequestHandler, Response } from 'express';
import {
  assertNoExistingSigtermListeners,
  createHtmlRenderMiddleware,
  createWebRequest,
  listen,
  mountConsumerMiddleware,
  type RenderFunction,
} from './ssrServerShared.js';
import type { SsrServerOptions } from './listen.js';
import { bindCommit } from './bindCommit.js';
import type { RenderResult } from './types.js';
import type { PipeableStream } from 'react-dom/server';

const createMockRes = (): Response => {
  const headers: Record<string, string | string[]> = {};
  const res = new EventEmitter() as any;
  res.writableEnded = false;
  res.setHeader = vi.fn((name: string, value: unknown) => {
    headers[String(name).toLowerCase()] = value as string | string[];
    return res;
  });
  res.append = vi.fn((name: string, value: unknown) => {
    const key = String(name).toLowerCase();
    const existing = headers[key];
    if (existing === undefined) {
      headers[key] = String(value);
    } else if (Array.isArray(existing)) {
      existing.push(String(value));
    } else {
      headers[key] = [existing, String(value)];
    }
    return res;
  });
  res.set = vi.fn((nextHeaders: Record<string, string>) => {
    for (const [name, value] of Object.entries(nextHeaders)) {
      headers[name.toLowerCase()] = value;
    }
    return res;
  });
  res.getHeader = vi.fn((name: string) => headers[name.toLowerCase()]);
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.end = vi.fn(() => {
    res.writableEnded = true;
    return res;
  });
  return res as Response;
};

const createDocumentResult = ({
  abort = vi.fn(),
  pipe = vi.fn((destination: NodeJS.WritableStream) => destination),
  statusCode = 200,
  headers = new Headers(),
  inlineScripts = [] as string[],
}: {
  abort?: ReturnType<typeof vi.fn>;
  pipe?: ReturnType<typeof vi.fn>;
  statusCode?: number;
  headers?: Headers;
  inlineScripts?: string[];
} = {}) => ({
  abort,
  pipe,
  result: {
    statusCode,
    headers,
    inlineScripts,
    commit: bindCommit({
      pipe: pipe as PipeableStream['pipe'],
      abort: abort as PipeableStream['abort'],
    }),
  } satisfies RenderResult,
});

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

describe('createWebRequest', () => {
  it('normalizes array header values', () => {
    const req = {
      protocol: 'http',
      originalUrl: '/submit',
      method: 'POST',
      get: () => 'localhost',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': ['1.1.1.1', '2.2.2.2'],
      },
      readableEnded: true,
      body: { hello: 'world' },
    } as unknown as Request;

    const request = createWebRequest(req, new AbortController().signal);
    expect(request.headers.get('content-type')).toBe('application/json');
    expect(request.headers.get('x-forwarded-for')).toBe('1.1.1.1, 2.2.2.2');
  });

  it('rebuilds JSON body when the request stream was already consumed', async () => {
    const req = {
      protocol: 'http',
      originalUrl: '/submit',
      method: 'POST',
      get: () => 'localhost',
      headers: { 'content-type': 'application/json' },
      readableEnded: true,
      body: { hello: 'world' },
    } as unknown as Request;

    const request = createWebRequest(req, new AbortController().signal);
    expect(await request.json()).toEqual({ hello: 'world' });
  });

  it('rebuilds urlencoded body from a parsed object', async () => {
    const req = {
      protocol: 'http',
      originalUrl: '/submit',
      method: 'POST',
      get: () => 'localhost',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      readableEnded: true,
      body: { message: 'hello', tags: ['a', 'b'] },
    } as unknown as Request;

    const request = createWebRequest(req, new AbortController().signal);
    expect(request.headers.get('content-type')).toBe(
      'application/x-www-form-urlencoded',
    );
    const formData = await request.formData();
    expect(formData.get('message')).toBe('hello');
    expect(formData.getAll('tags')).toEqual(['a', 'b']);
  });

  it('forwards an unread body when complete is true but readableEnded is false', async () => {
    const payload = JSON.stringify({ hello: 'world' });
    const stream = Readable.from([payload]);
    // `complete` is set the way Node does after the message arrives; the stream
    // is still unread (`readableEnded` remains false on a real Readable).
    Object.defineProperty(stream, 'complete', { value: true });
    Object.assign(stream, {
      protocol: 'http',
      originalUrl: '/submit',
      method: 'POST',
      get: () => 'localhost',
      headers: { 'content-type': 'application/json' },
    });
    expect(stream.readableEnded).toBe(false);

    const request = createWebRequest(
      stream as unknown as Request,
      new AbortController().signal,
    );
    expect(await request.json()).toEqual({ hello: 'world' });
  });

  it('passes through string bodies after the stream was consumed', async () => {
    const req = {
      protocol: 'http',
      originalUrl: '/submit',
      method: 'POST',
      get: () => 'localhost',
      headers: { 'content-type': 'text/plain' },
      readableEnded: true,
      body: 'raw-body',
    } as unknown as Request;

    const request = createWebRequest(req, new AbortController().signal);
    expect(await request.text()).toBe('raw-body');
  });
});

describe('createHtmlRenderMiddleware abort-before-write', () => {
  const htmlMiddlewareOptions = {
    assets: { bootstrapModules: [], css: [], modulePreloads: [] },
    cspEnabled: false,
    cspExtraSources: {},
    cspReportOnlyEnabled: false,
    cspReportOnlyExtraSources: {},
    development: true,
  };

  const createReq = (overrides: Record<string, unknown> = {}) =>
    ({
      protocol: 'http',
      originalUrl: '/',
      method: 'GET',
      get: () => 'localhost',
      headers: {},
      ...overrides,
    }) as unknown as Request;

  it('does not write HTML when the client disconnects before headers', async () => {
    // Deferred so the test can disconnect before render() resolves.

    let resolveRender!: (result: RenderResult) => void;
    const renderPromise = new Promise<RenderResult>((resolve) => {
      resolveRender = resolve;
    });

    const middleware = createHtmlRenderMiddleware({
      render: async () => renderPromise,
      ...htmlMiddlewareOptions,
    });

    const req = createReq();
    const res = createMockRes();
    const next = vi.fn();

    const done = middleware(req, res, next);

    res.emit('close');

    const { abort, pipe, result } = createDocumentResult();
    resolveRender(result);

    await done;

    expect(abort).toHaveBeenCalledTimes(1);
    expect(pipe).not.toHaveBeenCalled();
    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('skips render when the request is already disconnected', async () => {
    const render = vi.fn();
    const middleware = createHtmlRenderMiddleware({
      render,
      ...htmlMiddlewareOptions,
    });

    const req = createReq({ destroyed: true });
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(render).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('does not write a short-circuit Response after disconnect', async () => {
    // Deferred so the test can disconnect before render() resolves.

    let resolveRender!: (result: RenderResult) => void;
    const renderPromise = new Promise<RenderResult>((resolve) => {
      resolveRender = resolve;
    });

    const middleware = createHtmlRenderMiddleware({
      render: async () => renderPromise,
      ...htmlMiddlewareOptions,
    });

    const req = createReq();
    const res = createMockRes();
    const next = vi.fn();

    const done = middleware(req, res, next);
    res.emit('close');
    resolveRender({
      response: new Response('gone', {
        status: 302,
        headers: { Location: '/' },
      }),
    });

    await done;

    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('aborts React when the client disconnects during header writes and does not pipe', async () => {
    const { abort, pipe, result } = createDocumentResult();
    const res = createMockRes();
    // Disconnect lands while commit is writing headers, after the initial
    // abort check and before pipe.
    (res.set as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      res.emit('close');
      return res;
    });

    const middleware = createHtmlRenderMiddleware({
      render: async () => result,
      ...htmlMiddlewareOptions,
    });

    await middleware(createReq(), res, vi.fn());

    expect(abort).toHaveBeenCalledTimes(1);
    expect(pipe).not.toHaveBeenCalled();
  });

  it('does not write a short-circuit Response when the client disconnects mid-read', async () => {
    const res = createMockRes();
    const response = {
      status: 302,
      headers: new Headers({ Location: '/next' }),
      body: {},
      arrayBuffer: async () => {
        res.emit('close');
        return new TextEncoder().encode('redirect').buffer;
      },
    } as unknown as globalThis.Response;

    const middleware = createHtmlRenderMiddleware({
      render: async () => ({ response }),
      ...htmlMiddlewareOptions,
    });
    const next = vi.fn();

    await middleware(createReq(), res, next);

    expect(res.append).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('aborts React when the client disconnects after pipe starts', async () => {
    const { abort, pipe, result } = createDocumentResult();
    const middleware = createHtmlRenderMiddleware({
      render: async () => result,
      ...htmlMiddlewareOptions,
    });

    const req = createReq();
    const res = createMockRes();

    await middleware(req, res, vi.fn());

    expect(pipe).toHaveBeenCalledTimes(1);
    expect(abort).not.toHaveBeenCalled();

    res.emit('close');

    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('swallows cancel rejections and does not call Express next', async () => {
    const onRenderError = vi.fn();
    // Deferred so the test can reject after disconnect.

    let rejectRender!: (error: Error) => void;
    const renderPromise = new Promise<RenderResult>((_resolve, reject) => {
      rejectRender = reject;
    });

    const middleware = createHtmlRenderMiddleware({
      render: async () => renderPromise,
      onRenderError,
      ...htmlMiddlewareOptions,
    });

    const req = createReq();
    const res = createMockRes();
    const next = vi.fn();

    const done = middleware(req, res, next);
    res.emit('close');
    rejectRender(new Error('render cancelled'));

    await done;

    expect(onRenderError).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards connected render failures to Express next', async () => {
    const onRenderError = vi.fn();
    const boom = new Error('genuine render failure');
    const middleware = createHtmlRenderMiddleware({
      render: async () => {
        throw boom;
      },
      onRenderError,
      ...htmlMiddlewareOptions,
    });

    const req = createReq();
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(onRenderError).toHaveBeenCalledWith(boom);
    expect(next).toHaveBeenCalledWith(boom);
  });

  it('omits nonce from CSP headers when none was requested', async () => {
    const middleware = createHtmlRenderMiddleware({
      render: async () =>
        createDocumentResult({
          inlineScripts: ['console.log(1)'],
        }).result,
      assets: { bootstrapModules: [], css: [], modulePreloads: [] },
      cspEnabled: true,
      cspExtraSources: {},
      cspReportOnlyEnabled: false,
      cspReportOnlyExtraSources: {},
      development: false,
    });

    const req = {
      protocol: 'http',
      originalUrl: '/',
      method: 'GET',
      get: () => 'localhost',
      headers: {},
    } as unknown as Request;
    const res = createMockRes();

    await middleware(req, res, vi.fn());

    const csp = res.getHeader('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).not.toMatch(/'nonce-/);
  });

  it('appends loader headers such as Set-Cookie before CSP', async () => {
    const middleware = createHtmlRenderMiddleware({
      render: async () =>
        createDocumentResult({
          headers: new Headers({
            'Set-Cookie': 'sku-vite-ssr=1; Path=/',
          }),
        }).result,
      assets: { bootstrapModules: [], css: [], modulePreloads: [] },
      cspEnabled: false,
      cspExtraSources: {},
      cspReportOnlyEnabled: false,
      cspReportOnlyExtraSources: {},
      development: false,
    });

    const req = {
      protocol: 'http',
      originalUrl: '/set-cookie',
      method: 'GET',
      get: () => 'localhost',
      headers: {},
    } as unknown as Request;
    const res = createMockRes();

    await middleware(req, res, vi.fn());

    expect(res.append).toHaveBeenCalledWith(
      'set-cookie',
      'sku-vite-ssr=1; Path=/',
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('threads Express req into render (getters receive req only)', async () => {
    const render = vi.fn<RenderFunction>(
      async () => createDocumentResult().result,
    );

    const middleware = createHtmlRenderMiddleware({
      render,
      assets: { bootstrapModules: [], css: [], modulePreloads: [] },
      cspEnabled: false,
      cspExtraSources: {},
      cspReportOnlyEnabled: false,
      cspReportOnlyExtraSources: {},
      development: true,
    });

    const req = {
      protocol: 'http',
      originalUrl: '/about?x=1',
      method: 'GET',
      path: '/about',
      get: () => 'localhost',
      headers: {},
      skuUserId: 'from-middleware',
    } as unknown as Request;
    const res = createMockRes();

    await middleware(req, res, vi.fn());

    expect(render).toHaveBeenCalledTimes(1);
    const [fetchRequest, expressReq] = render.mock.calls[0];
    expect(fetchRequest).toBeInstanceOf(globalThis.Request);
    expect(expressReq).toBe(req);
    expect(expressReq).toHaveProperty('skuUserId', 'from-middleware');
    // Fetch Request is separate from Express req — not passed as the same object.
    expect(fetchRequest).not.toBe(expressReq);
  });
});

describe('listen', () => {
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
  });

  it('serves client assets under publicPath before catch-all middleware', async () => {
    clientDirectory = await mkdtemp(path.join(tmpdir(), 'sku-ssr-static-'));
    await writeFile(
      path.join(clientDirectory, 'app.js'),
      'console.log("asset")',
    );

    const result = await listen({
      ...baseListenOptions,
      port: 0,
      clientDirectory,
      middleware: [
        (_req, res) => {
          res.status(418).type('text/plain').send('middleware-handled');
        },
      ],
    });
    servers.push(result);

    const { port } = result.httpServer.address() as { port: number };
    const asset = await fetch(`http://127.0.0.1:${port}/static/app.js`);
    expect(asset.status).toBe(200);
    expect(await asset.text()).toBe('console.log("asset")');

    const other = await fetch(`http://127.0.0.1:${port}/not-an-asset`);
    expect(other.status).toBe(418);
    expect(await other.text()).toBe('middleware-handled');
  });

  it('omits express.static when clientDirectory is absent', async () => {
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      middleware: [
        (_req, res) => {
          res.status(418).type('text/plain').send('middleware-handled');
        },
      ],
    });
    servers.push(result);

    const { port } = result.httpServer.address() as { port: number };
    const assetPath = await fetch(`http://127.0.0.1:${port}/static/app.js`);
    expect(assetPath.status).toBe(418);
    expect(await assetPath.text()).toBe('middleware-handled');
  });

  it('calls onListen once with app, httpServer, and bound port', async () => {
    const onListen = vi.fn();
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      onListen,
      middleware: [
        (_req, res) => {
          res.status(200).end();
        },
      ],
    });
    servers.push(result);

    const { port } = result.httpServer.address() as { port: number };
    expect(onListen).toHaveBeenCalledTimes(1);
    expect(onListen).toHaveBeenCalledWith({
      app: result.app,
      httpServer: result.httpServer,
      port,
    });
  });

  it('rejects startup when onListen throws', async () => {
    await expect(
      listen({
        ...baseListenOptions,
        port: 0,
        onListen: () => {
          throw new Error('onListen failed');
        },
        middleware: [
          (_req, res) => {
            res.status(200).end();
          },
        ],
      }),
    ).rejects.toThrow('onListen failed');
  });

  it('rejects startup when onListen returns a rejected promise', async () => {
    await expect(
      listen({
        ...baseListenOptions,
        port: 0,
        onListen: async () => {
          throw new Error('onListen rejected');
        },
        middleware: [
          (_req, res) => {
            res.status(200).end();
          },
        ],
      }),
    ).rejects.toThrow('onListen rejected');
  });

  it('sets trust proxy hop count 1 when expressTrustProxy is true', async () => {
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      expressTrustProxy: true,
      middleware: [
        (_req, res) => {
          res.status(200).end();
        },
      ],
    });
    servers.push(result);

    expect(result.app.get('trust proxy')).toBe(1);
  });

  it('leaves Express trust proxy default when expressTrustProxy is omitted', async () => {
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      middleware: [
        (_req, res) => {
          res.status(200).end();
        },
      ],
    });
    servers.push(result);

    expect(result.app.get('trust proxy')).toBe(false);
  });
});

describe('mountConsumerMiddleware', () => {
  it('does nothing when middleware is omitted', () => {
    const mount = vi.fn();
    expect(() => mountConsumerMiddleware(undefined, mount)).not.toThrow();
    expect(mount).not.toHaveBeenCalled();
  });

  it('mounts each handler when middleware is present', () => {
    const a: RequestHandler = (_req, _res, next) => next();
    const b: RequestHandler = (_req, _res, next) => next();
    const mount = vi.fn();
    mountConsumerMiddleware([a, b], mount);
    expect(mount).toHaveBeenCalledTimes(2);
    expect(mount).toHaveBeenNthCalledWith(1, a);
    expect(mount).toHaveBeenNthCalledWith(2, b);
  });
});

describe('production server shutdown', () => {
  const servers: Server[] = [];

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

  it('keeps a keep-alive timeout that onListen sets', async () => {
    const result = await startServer({
      onListen({ httpServer }) {
        httpServer.keepAliveTimeout = 65_000;
      },
    });

    expect(result.httpServer.keepAliveTimeout).toBe(65_000);
    expect(result.httpServer.headersTimeout).toBe(60_000);
  });

  it('rejects startup when a SIGTERM listener already exists', async () => {
    function dependencyListener() {}
    process.on('SIGTERM', dependencyListener);
    try {
      await expect(startServer()).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Found 1 SIGTERM listener: dependencyListener. A dependency can register a SIGTERM listener. Move shutdown work to onShutdown. For a dependency's listener, turn off its signal handling in onListen with the dependency's own option or function, and call its shutdown from onShutdown. If it has no such option or function, call process.removeAllListeners('SIGTERM') in onListen instead.]`,
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

  it('sends Connection: close on a request whose headers finish during the drain', async () => {
    const exit = mockExit();
    const gate = deferred();
    const entered = deferred();
    const { httpServer } = await startServer({
      middleware: [
        async (req, res) => {
          if (req.path === '/slow') {
            entered.resolve();
            await gate.promise;
          }
          res.status(200).type('text/plain').end('ok');
        },
      ],
    });
    const port = portOf(httpServer);

    const slow = fetch(`http://127.0.0.1:${port}/slow`).catch(() => undefined);
    await entered.promise;

    const accepted = new Promise<void>((resolve) => {
      httpServer.once('connection', () => resolve());
    });
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.on('error', () => {});
    let response = '';
    socket.on('data', (chunk: Buffer) => {
      response += chunk.toString();
    });
    await accepted;
    socket.write('GET /late HTTP/1.1\r\nHost: localhost\r\n');
    await new Promise((resolve) => setTimeout(resolve, 20));

    const closed = closedWithin(socket);
    process.emit('SIGTERM');
    socket.write('\r\n');
    await closed;

    expect(response).toMatch(/^HTTP\/1\.1 200/);
    expect(response).toMatch(/\r\nConnection: close\r\n/i);

    gate.resolve();
    await slow;
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(0);
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

  it('reports a rejected onShutdown and exits 1', async () => {
    const exit = mockExit();
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {});
    await startServer({
      onShutdown: async () => {
        throw new Error('flush failed');
      },
    });

    process.emit('SIGTERM');
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(1);
    });
    expect(exit).toHaveBeenCalledTimes(1);
    expect(reported).toHaveBeenCalledWith(expect.any(Error));
    expect(reported.mock.calls[0]?.[0]).toMatchObject({
      message: 'flush failed',
    });
  });
});

describe('assertNoExistingSigtermListeners', () => {
  const registered: Array<() => void> = [];

  const addSigtermListener = (listener: () => void) => {
    process.on('SIGTERM', listener);
    registered.push(listener);
  };

  afterEach(() => {
    for (const listener of registered.splice(0)) {
      process.removeListener('SIGTERM', listener);
    }
  });

  it('ignores listeners the host registered', () => {
    function hostListener() {}
    addSigtermListener(hostListener);

    expect(() =>
      assertNoExistingSigtermListeners(new Set([hostListener])),
    ).not.toThrow();
  });

  it('names only the listeners the host did not register', () => {
    function hostListener() {}
    function entryListener() {}
    addSigtermListener(hostListener);
    addSigtermListener(entryListener);

    expect(() =>
      assertNoExistingSigtermListeners(new Set([hostListener])),
    ).toThrow(/^Found 1 SIGTERM listener: entryListener\./);
  });
});
