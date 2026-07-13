import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { createHtmlRenderMiddleware } from './ssrServerShared.js';
import type { RenderResult } from './types.js';

const createMockRes = (): Response => {
  const headers: Record<string, string> = {};
  const res = new EventEmitter() as any;
  res.writableEnded = false;
  res.setHeader = vi.fn((name: string, value: unknown) => {
    headers[String(name).toLowerCase()] = String(value);
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
});
