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
