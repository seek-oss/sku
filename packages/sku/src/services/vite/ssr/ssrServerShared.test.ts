import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  createHtmlRenderMiddleware,
  createWebRequest,
  listen,
  type RenderFunction,
} from './ssrServerShared.js';
import type { RenderResult } from './types.js';

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

const baseListenOptions = {
  publicPath: '/static/',
  render: (async () => {
    throw new Error('render should not run in these tests');
  }) as RenderFunction,
  assets: { bootstrapModules: [], css: [], modulePreloads: [] },
  cspEnabled: false,
  cspExtraScriptSrcHosts: [] as string[],
  cspReportOnlyEnabled: false,
  cspReportOnlyExtraScriptSrcHosts: [] as string[],
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
  it('does not write HTML when the client disconnects before headers', async () => {
    let resolveRender!: (result: RenderResult) => void;
    const renderPromise = new Promise<RenderResult>((resolve) => {
      resolveRender = resolve;
    });

    const middleware = createHtmlRenderMiddleware({
      render: async () => renderPromise,
      assets: { bootstrapModules: [], css: [], modulePreloads: [] },
      cspEnabled: false,
      cspExtraScriptSrcHosts: [],
      cspReportOnlyEnabled: false,
      cspReportOnlyExtraScriptSrcHosts: [],
      development: true,
    });

    const req = {
      protocol: 'http',
      originalUrl: '/',
      method: 'GET',
      get: () => 'localhost',
      headers: {},
    } as unknown as Request;
    const res = createMockRes();
    const next = vi.fn();

    const done = middleware(req, res, next);

    res.emit('close');

    const abort = vi.fn();
    const pipe = vi.fn();
    resolveRender({
      pipe,
      abort,
      statusCode: 200,
      headers: new Headers(),
      inlineScripts: [],
    });

    await done;

    expect(pipe).not.toHaveBeenCalled();
    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('omits nonce from CSP headers when none was requested', async () => {
    const middleware = createHtmlRenderMiddleware({
      render: async () => ({
        pipe: vi.fn(),
        abort: vi.fn(),
        statusCode: 200,
        headers: new Headers(),
        inlineScripts: ['console.log(1)'],
      }),
      assets: { bootstrapModules: [], css: [], modulePreloads: [] },
      cspEnabled: true,
      cspExtraScriptSrcHosts: [],
      cspReportOnlyEnabled: false,
      cspReportOnlyExtraScriptSrcHosts: [],
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
      render: async () => ({
        pipe: vi.fn(),
        abort: vi.fn(),
        statusCode: 200,
        headers: new Headers({
          'Set-Cookie': 'sku-vite-ssr=1; Path=/',
        }),
        inlineScripts: [],
      }),
      assets: { bootstrapModules: [], css: [], modulePreloads: [] },
      cspEnabled: false,
      cspExtraScriptSrcHosts: [],
      cspReportOnlyEnabled: false,
      cspReportOnlyExtraScriptSrcHosts: [],
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
    const render = vi.fn<RenderFunction>(async () => ({
      pipe: vi.fn(),
      abort: vi.fn(),
      statusCode: 200,
      headers: new Headers(),
      inlineScripts: [],
    }));

    const middleware = createHtmlRenderMiddleware({
      render,
      assets: { bootstrapModules: [], css: [], modulePreloads: [] },
      cspEnabled: false,
      cspExtraScriptSrcHosts: [],
      cspReportOnlyEnabled: false,
      cspReportOnlyExtraScriptSrcHosts: [],
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
      middleware: (_req, res) => {
        res.status(418).type('text/plain').send('middleware-handled');
      },
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

  it('calls onListen once with app, httpServer, and bound port', async () => {
    const onListen = vi.fn();
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      onListen,
      middleware: (_req, res) => {
        res.status(200).end();
      },
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
        middleware: (_req, res) => {
          res.status(200).end();
        },
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
        middleware: (_req, res) => {
          res.status(200).end();
        },
      }),
    ).rejects.toThrow('onListen rejected');
  });

  it('sets trust proxy hop count 1 when expressTrustProxy is true', async () => {
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      expressTrustProxy: true,
      middleware: (_req, res) => {
        res.status(200).end();
      },
    });
    servers.push(result);

    expect(result.app.get('trust proxy')).toBe(1);
  });

  it('leaves Express trust proxy default when expressTrustProxy is omitted', async () => {
    const result = await listen({
      ...baseListenOptions,
      port: 0,
      middleware: (_req, res) => {
        res.status(200).end();
      },
    });
    servers.push(result);

    expect(result.app.get('trust proxy')).toBe(false);
  });
});
