import { describe, expect, expectTypeOf, it } from 'vitest';
import { RouterContextProvider } from 'react-router';

import { defineClientEntry, defineServerEntry } from './defineEntry.js';
import { createSkuContexts } from './skuContext.js';

describe('defineServerEntry Site / Language inference', () => {
  it('types sibling site and useSite from narrowed getSite', () => {
    const server = defineServerEntry({
      getSite() {
        return Math.random() > 0.5 ? ('au' as const) : ('nz' as const);
      },
      getLanguage() {
        return Math.random() > 0.5 ? ('en' as const) : ('fr' as const);
      },
      getReactContext({ site }) {
        expectTypeOf(site).toEqualTypeOf<'au' | 'nz'>();
        return { ok: true as const };
      },
      getRouterContext({ site }) {
        expectTypeOf(site).toEqualTypeOf<'au' | 'nz'>();
        return new RouterContextProvider();
      },
    });

    expect(server.getSite).toBeTypeOf('function');
    expect(server.getLanguage).toBeTypeOf('function');

    type Site = ReturnType<NonNullable<(typeof server)['getSite']>>;
    type Language = ReturnType<NonNullable<(typeof server)['getLanguage']>>;
    expectTypeOf<Site>().toEqualTypeOf<'au' | 'nz'>();
    expectTypeOf<Language>().toEqualTypeOf<'en' | 'fr'>();

    const { useSite } = createSkuContexts<typeof server>();
    expect(useSite).toBeTypeOf('function');
    expectTypeOf(useSite).returns.toEqualTypeOf<'au' | 'nz'>();
  });

  it('types useSite as string when getSite is omitted', () => {
    const server = defineServerEntry({
      getClientContext() {
        return { fromServer: true as const };
      },
    });

    expect(server.getSite).toBeUndefined();
    expect(server.getClientContext).toBeTypeOf('function');

    const { useSite } = createSkuContexts<typeof server>();
    expect(useSite).toBeTypeOf('function');
    expectTypeOf(useSite).returns.toEqualTypeOf<string>();
  });
});

describe('defineClientEntry from ServerEntry', () => {
  it('types client callbacks from narrowed server getSite / getClientContext', () => {
    const server = defineServerEntry({
      getSite() {
        return Math.random() > 0.5 ? ('au' as const) : ('nz' as const);
      },
      getClientContext() {
        return {
          fromServer: true as const,
          userId: 'fixture-user' as const,
        };
      },
    });

    const client = defineClientEntry<typeof server>()({
      onHydrate({ clientContext }) {
        expectTypeOf(clientContext).toEqualTypeOf<
          | {
              fromServer: true;
              userId: 'fixture-user';
            }
          | undefined
        >();
      },
      getReactContext({ site, clientContext }) {
        expectTypeOf(site).toEqualTypeOf<'au' | 'nz'>();
        expectTypeOf(clientContext).toEqualTypeOf<
          | {
              fromServer: true;
              userId: 'fixture-user';
            }
          | undefined
        >();
        return { makeClient: true as const };
      },
      getRouterContext({ site, clientContext, reactContext }) {
        expectTypeOf(site).toEqualTypeOf<'au' | 'nz'>();
        expectTypeOf(clientContext).toEqualTypeOf<
          | {
              fromServer: true;
              userId: 'fixture-user';
            }
          | undefined
        >();
        expectTypeOf(reactContext).toEqualTypeOf<
          { makeClient: true } | undefined
        >();
        return new RouterContextProvider();
      },
    });

    // Keep `server` as a value so `typeof server` is not type-only unused.
    expect(server.getSite).toBeTypeOf('function');
    expect(client.getReactContext).toBeTypeOf('function');
    expect(client.getRouterContext).toBeTypeOf('function');
  });

  it('types site as string and clientContext as undefined when ServerEntry is omitted', () => {
    const client = defineClientEntry({
      onHydrate({ clientContext }) {
        expectTypeOf(clientContext).toEqualTypeOf<undefined>();
      },
      getReactContext({ site, clientContext }) {
        expectTypeOf(site).toEqualTypeOf<string>();
        expectTypeOf(clientContext).toEqualTypeOf<undefined>();
        return { ok: true as const };
      },
      getRouterContext({ site, clientContext, reactContext }) {
        expectTypeOf(site).toEqualTypeOf<string>();
        expectTypeOf(clientContext).toEqualTypeOf<undefined>();
        expectTypeOf(reactContext).toEqualTypeOf<{ ok: true } | undefined>();
        return new RouterContextProvider();
      },
    });

    expect(client.getReactContext).toBeTypeOf('function');
  });
});

describe('async getClientContext / getReactContext inference', () => {
  it('unwraps Promise returns for hooks and sibling args', () => {
    const server = defineServerEntry({
      getSite() {
        return 'au' as const;
      },
      async getClientContext() {
        return { userId: 'fixture-user' as const };
      },
      async getReactContext({ site, clientContext }) {
        expectTypeOf(site).toEqualTypeOf<'au'>();
        expectTypeOf(clientContext).toEqualTypeOf<
          { userId: 'fixture-user' } | undefined
        >();
        return { api: 'server-api' as const };
      },
      async getRouterContext({ clientContext, reactContext }) {
        expectTypeOf(clientContext).toEqualTypeOf<
          { userId: 'fixture-user' } | undefined
        >();
        expectTypeOf(reactContext).toEqualTypeOf<
          { api: 'server-api' } | undefined
        >();
        return new RouterContextProvider();
      },
    });

    const { useClientContext, useReactContext } =
      createSkuContexts<typeof server>();
    expectTypeOf(useClientContext).returns.toEqualTypeOf<{
      userId: 'fixture-user';
    }>();
    expectTypeOf(useReactContext).returns.toEqualTypeOf<
      { api: 'server-api' } | undefined
    >();

    const client = defineClientEntry<typeof server>()({
      async getReactContext({ clientContext }) {
        expectTypeOf(clientContext).toEqualTypeOf<
          { userId: 'fixture-user' } | undefined
        >();
        return { api: 'client-api' as const };
      },
      async getRouterContext({ reactContext }) {
        expectTypeOf(reactContext).toEqualTypeOf<
          { api: 'client-api' } | undefined
        >();
        return new RouterContextProvider();
      },
    });

    expect(server.getClientContext).toBeTypeOf('function');
    expect(client.getReactContext).toBeTypeOf('function');

    const { useReactContext: useUnionReactContext } = createSkuContexts<
      typeof server,
      typeof client
    >();
    expectTypeOf(useUnionReactContext).returns.toEqualTypeOf<
      { api: 'server-api' } | { api: 'client-api' }
    >();
  });

  it('unwraps a sync getter that returns a Promise', () => {
    const server = defineServerEntry({
      getClientContext() {
        return Promise.resolve({ userId: 'fixture-user' as const });
      },
    });

    const { useClientContext } = createSkuContexts<typeof server>();
    expectTypeOf(useClientContext).returns.toEqualTypeOf<{
      userId: 'fixture-user';
    }>();
    expect(server.getClientContext).toBeTypeOf('function');
  });

  it('allows optional fields and undefined unions on JsonValue objects', () => {
    const server = defineServerEntry({
      getClientContext() {
        return {
          theme: Math.random() > 0.5 ? ('dark' as const) : undefined,
          userId: 'fixture-user' as const,
        };
      },
    });

    const { useClientContext } = createSkuContexts<typeof server>();
    expectTypeOf(useClientContext).returns.toEqualTypeOf<{
      theme: 'dark' | undefined;
      userId: 'fixture-user';
    }>();
    expect(server.getClientContext).toBeTypeOf('function');
  });

  it('rejects Dates and functions in JsonValue', () => {
    const serverWithDate = defineServerEntry({
      // @ts-expect-error Dates are not JsonValue
      getClientContext: () => ({ now: new Date() }),
    });
    const serverWithFn = defineServerEntry({
      // @ts-expect-error functions are not JsonValue
      getClientContext: () => ({ run: () => undefined }),
    });

    expect(serverWithDate.getClientContext).toBeTypeOf('function');
    expect(serverWithFn.getClientContext).toBeTypeOf('function');
  });

  it('keeps getSite, getLanguage, and client getRouterContext synchronous', () => {
    const serverWithAsyncSite = defineServerEntry({
      // @ts-expect-error getSite must be synchronous
      getSite: async () => 'au' as const,
    });
    const serverWithAsyncLanguage = defineServerEntry({
      // @ts-expect-error getLanguage must be synchronous
      getLanguage: async () => 'en' as const,
    });

    expect(serverWithAsyncSite.getSite).toBeTypeOf('function');
    expect(serverWithAsyncLanguage.getLanguage).toBeTypeOf('function');
  });

  it('allows dual-entry getRouterContext to return a Promise', () => {
    const server = defineServerEntry({
      getRouterContext: async () => new RouterContextProvider(),
    });
    const client = defineClientEntry({
      getRouterContext: async () => new RouterContextProvider(),
    });

    expect(server.getRouterContext).toBeTypeOf('function');
    expect(client.getRouterContext).toBeTypeOf('function');
  });
});
