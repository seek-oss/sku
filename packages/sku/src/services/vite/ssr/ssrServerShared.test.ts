import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  createHtmlRenderMiddleware,
  createWebRequest,
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
});
