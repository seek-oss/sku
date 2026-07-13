import { describe, expect, it } from 'vitest';
import type { StaticHandlerContext } from 'react-router';
import { buildBootstrapScriptContent } from './bootstrap.js';

const parseHydrationData = (script: string) => {
  const hydrationPart = script.split('window.__staticRouterHydrationData=')[1];
  return JSON.parse(hydrationPart) as {
    loaderData: unknown;
    actionData: unknown;
    errors: Record<string, { message?: string; stack?: string }> | null;
  };
};

describe('buildBootstrapScriptContent', () => {
  it('scrubs Promises from loaderData and actionData', () => {
    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      {
        loaderData: { a: Promise.resolve('x'), b: 'ok' },
        actionData: { c: Promise.resolve('y'), d: 'done' },
        errors: null,
      } as unknown as StaticHandlerContext,
    );

    const data = parseHydrationData(script);
    expect(data.loaderData).toEqual({ a: undefined, b: 'ok' });
    expect(data.actionData).toEqual({ c: undefined, d: 'done' });
  });

  it('serialises clientContext and language into the bootstrap', () => {
    const script = buildBootstrapScriptContent(
      { css: [], modulePreloads: [] },
      {
        loaderData: {},
        actionData: null,
        errors: null,
      } as unknown as StaticHandlerContext,
      {
        clientContext: { theme: 'fixture' },
        language: 'fr',
      },
    );

    expect(script).toContain(
      'window.__SKU_CLIENT_CONTEXT__={"theme":"fixture"}',
    );
    expect(script).toContain('window.__SKU_LANGUAGE__="fr"');
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
      { development: false },
    );

    const data = parseHydrationData(script);
    expect(data.errors?.['0']).toEqual({ message: 'Boom' });
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
      { development: true },
    );

    const data = parseHydrationData(script);
    expect(data.errors?.['0']).toMatchObject({
      message: 'Boom',
      stack: 'Error: Boom\n    at loader',
    });
  });
});
