import { describe, expect, it } from 'vitest';
import {
  UNSAFE_ErrorResponseImpl as ErrorResponseImpl,
  type StaticHandlerContext,
} from 'react-router';
import { buildBootstrapScriptContent } from './bootstrap.js';

const parseHydrationData = (script: string) => {
  const hydrationPart = script.split('window.__staticRouterHydrationData=')[1];
  return JSON.parse(hydrationPart) as {
    loaderData: unknown;
    actionData: unknown;
    errors: Record<
      string,
      {
        message?: string;
        stack?: string;
        __type?: string;
        __subType?: string;
        status?: number;
        statusText?: string;
        data?: unknown;
        internal?: boolean;
      }
    > | null;
  };
};

const emptyContext = {
  loaderData: {},
  actionData: null,
  errors: null,
} as unknown as StaticHandlerContext;

describe('buildBootstrapScriptContent', () => {
  it('scrubs Promises from loaderData and actionData', () => {
    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      {
        loaderData: { a: Promise.resolve('x'), b: 'ok' },
        actionData: { c: Promise.resolve('y'), d: 'done' },
        errors: null,
      } as unknown as StaticHandlerContext,
      { site: 'au' },
    );

    const data = parseHydrationData(script);
    expect(data.loaderData).toEqual({ a: undefined, b: 'ok' });
    expect(data.actionData).toEqual({ c: undefined, d: 'done' });
  });

  it('serialises clientContext and site into the bootstrap', () => {
    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      emptyContext,
      {
        clientContext: { theme: 'fixture' },
        site: 'nz',
      },
    );

    expect(script).toContain(
      'window.__SKU_CLIENT_CONTEXT__={"theme":"fixture"}',
    );
    expect(script).toContain('window.__SKU_SITE__="nz"');
  });

  it('emits JS undefined when clientContext is omitted', () => {
    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      emptyContext,
      { site: 'au' },
    );

    expect(script).toContain('window.__SKU_CLIENT_CONTEXT__=undefined');
    expect(script).not.toContain('window.__SKU_CLIENT_CONTEXT__=null');
  });

  it('preserves intentional null clientContext', () => {
    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      emptyContext,
      { clientContext: null, site: 'au' },
    );

    expect(script).toContain('window.__SKU_CLIENT_CONTEXT__=null');
  });

  it('omits Error.stack in production serialization', () => {
    const error = new Error('Boom');
    error.stack = 'Error: Boom\n    at loader';

    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      {
        loaderData: {},
        actionData: null,
        errors: { '0': error },
      } as unknown as StaticHandlerContext,
      { development: false, site: 'au' },
    );

    const data = parseHydrationData(script);
    expect(data.errors?.['0']).toEqual({
      message: 'Boom',
      __type: 'Error',
    });
    expect(data.errors?.['0']).not.toHaveProperty('stack');
  });

  it('includes Error.stack in development serialization', () => {
    const error = new Error('Boom');
    error.stack = 'Error: Boom\n    at loader';

    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      {
        loaderData: {},
        actionData: null,
        errors: { '0': error },
      } as unknown as StaticHandlerContext,
      { development: true, site: 'au' },
    );

    const data = parseHydrationData(script);
    expect(data.errors?.['0']).toEqual({
      message: 'Boom',
      __type: 'Error',
      stack: 'Error: Boom\n    at loader',
    });
  });

  it('serialises RouteErrorResponse with __type for hydrate', () => {
    const error = new ErrorResponseImpl(404, 'Not Found', 'Missing page', true);

    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      {
        loaderData: {},
        actionData: null,
        errors: { '0': error },
      } as unknown as StaticHandlerContext,
      { site: 'au' },
    );

    const data = parseHydrationData(script);
    expect(data.errors?.['0']).toEqual({
      status: 404,
      statusText: 'Not Found',
      data: 'Missing page',
      internal: true,
      __type: 'RouteErrorResponse',
    });
  });

  it('includes __subType for named Error subclasses', () => {
    const error = new TypeError('Bad value');

    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      {
        loaderData: {},
        actionData: null,
        errors: { '0': error },
      } as unknown as StaticHandlerContext,
      { development: false, site: 'au' },
    );

    const data = parseHydrationData(script);
    expect(data.errors?.['0']).toEqual({
      message: 'Bad value',
      __type: 'Error',
      __subType: 'TypeError',
    });
  });
});
