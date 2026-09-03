import { readFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import type { Request as ExpressRequest } from 'express';
import {
  createContext,
  useContext,
  Suspense,
  use,
  type ReactNode,
} from 'react';
import { Outlet, RouterContextProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { buildSiteStaticHandlers } from './buildSiteStaticHandlers.js';
import { createSkuContexts, HeadAssets } from 'sku/runtime';
import { render } from './render.js';
import type { RenderAssets, RenderSuccess } from './types.js';

const neverResolving = () => new Promise<string>(() => {});

const { useSite, useClientContext, useReactContext } = createSkuContexts<
  {
    getClientContext: () => { userId: string };
    getReactContext: () => { api: string };
  },
  {
    getReactContext: () => { api: string };
  }
>();

const RootLayout = () => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <HeadAssets />
    </head>
    <body>
      <Outlet />
    </body>
  </html>
);

const Page = () => (
  <main>
    <p data-testid="site">{useSite()}</p>
    <p data-testid="user">{useClientContext()?.userId ?? 'no user'}</p>
    <p data-testid="api">{useReactContext()?.api ?? 'no api'}</p>
  </main>
);

const siteStaticHandlers = buildSiteStaticHandlers({
  au: [
    {
      Component: RootLayout,
      children: [{ path: '/', Component: Page }],
    },
  ],
});

const assets: RenderAssets = {
  css: [],
  modulePreloads: [],
  bootstrapModules: [],
};

const getSite = () => 'au';
const getClientContext = () => ({ userId: 'user-1' });
const getReactContext = () => ({ api: 'server-api' });

const commitToHtml = async (result: RenderSuccess) => {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
      final(callback) {
        callback();
        resolve();
      },
    });
    writable.on('error', reject);
    result.commit(writable);
  });

  return Buffer.concat(chunks).toString('utf-8');
};

const renderToHtml = async ({
  includeClientContext = true,
  includeReactContext = true,
}: {
  includeClientContext?: boolean;
  includeReactContext?: boolean;
} = {}) => {
  const result = await render({
    siteStaticHandlers,
    request: new Request('http://localhost/'),
    req: { path: '/' } as ExpressRequest,
    assets,
    getSite,
    getClientContext: includeClientContext ? getClientContext : undefined,
    getReactContext: includeReactContext ? getReactContext : undefined,
  });

  if ('response' in result) {
    throw new Error('Expected a streamed document, not a Response');
  }

  return commitToHtml(result);
};

describe('render', () => {
  it('always mounts SkuProvider with site, clientContext, and reactContext', async () => {
    const html = await renderToHtml();

    expect(html).toContain('>au<');
    expect(html).toContain('>user-1<');
    expect(html).toContain('>server-api<');
  });

  it('passes undefined clientContext / reactContext when getters are omitted', async () => {
    const html = await renderToHtml({
      includeClientContext: false,
      includeReactContext: false,
    });

    expect(html).toContain('>au<');
    expect(html).toContain('>no user<');
    expect(html).toContain('>no api<');
    expect(html).toContain('window.__SKU_CLIENT_CONTEXT__=undefined');
    expect(html).not.toContain('window.__SKU_CLIENT_CONTEXT__=null');
  });

  it('normalises nested undefined in clientContext for siblings, SkuProvider, and bootstrap', async () => {
    let siblingContext: unknown;
    const nestedHandlers = buildSiteStaticHandlers({
      au: [
        {
          Component: RootLayout,
          children: [
            {
              path: '/',
              Component: () => (
                <main>
                  <p data-testid="keys">
                    {Object.keys(useClientContext() ?? {}).join(',')}
                  </p>
                </main>
              ),
            },
          ],
        },
      ],
    });

    const result = await render({
      siteStaticHandlers: nestedHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      getClientContext: () => ({
        theme: 'dark',
        userId: undefined,
        tags: [undefined, 'a'],
      }),
      getReactContext: ({ clientContext }) => {
        siblingContext = clientContext;
        return { api: 'server-api' };
      },
    });

    if ('response' in result) {
      throw new Error('Expected a streamed document, not a Response');
    }

    const html = await commitToHtml(result);
    const expected = { theme: 'dark', tags: [null, 'a'] };

    expect(siblingContext).toEqual(expected);
    expect(html).toContain('>theme,tags<');
    expect(html).toContain(
      'window.__SKU_CLIENT_CONTEXT__={"theme":"dark","tags":[null,"a"]}',
    );
  });

  it('keeps top-level undefined clientContext as JS undefined after normalisation', async () => {
    let siblingContext: unknown = 'unset';

    await render({
      siteStaticHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      getClientContext: () => undefined,
      getReactContext: ({ clientContext }) => {
        siblingContext = clientContext;
        return { api: 'server-api' };
      },
    });

    expect(siblingContext).toBeUndefined();
  });

  it('projects sibling values into getRouterContext before query()', async () => {
    let seen: {
      site?: string;
      clientContext?: { userId: string };
      reactContext?: { api: string };
    } = {};

    await render({
      siteStaticHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      getClientContext,
      getReactContext,
      getRouterContext: ({ site, clientContext, reactContext }) => {
        seen = {
          site,
          clientContext: clientContext as { userId: string } | undefined,
          reactContext: reactContext as { api: string } | undefined,
        };
        return new RouterContextProvider();
      },
    });

    expect(seen).toEqual({
      site: 'au',
      clientContext: { userId: 'user-1' },
      reactContext: { api: 'server-api' },
    });
  });

  it('awaits Promise getClientContext before later getters and query()', async () => {
    const order: string[] = [];
    let release!: (value: { userId: string }) => void;
    const originalQuery = siteStaticHandlers.au.query.bind(
      siteStaticHandlers.au,
    );
    const query = vi.spyOn(siteStaticHandlers.au, 'query');
    query.mockImplementation((...args) => {
      order.push('query');
      return originalQuery(...args);
    });

    const pending = render({
      siteStaticHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      getClientContext: () => {
        order.push('clientContext');
        return new Promise<{ userId: string }>((resolve) => {
          release = resolve;
        });
      },
      getReactContext: () => {
        order.push('reactContext');
        return { api: 'server-api' };
      },
      getRouterContext: () => {
        order.push('routerContext');
        return new RouterContextProvider();
      },
    });

    await Promise.resolve();
    expect(order).toEqual(['clientContext']);

    release({ userId: 'user-1' });
    await pending;

    expect(order).toEqual([
      'clientContext',
      'reactContext',
      'routerContext',
      'query',
    ]);
  });

  it('awaits Promise getReactContext before getRouterContext and query()', async () => {
    const order: string[] = [];
    let release!: (value: { api: string }) => void;
    const originalQuery = siteStaticHandlers.au.query.bind(
      siteStaticHandlers.au,
    );
    const query = vi.spyOn(siteStaticHandlers.au, 'query');
    query.mockImplementation((...args) => {
      order.push('query');
      return originalQuery(...args);
    });

    const pending = render({
      siteStaticHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      getClientContext,
      getReactContext: () => {
        order.push('reactContext');
        return new Promise<{ api: string }>((resolve) => {
          release = resolve;
        });
      },
      getRouterContext: () => {
        order.push('routerContext');
        return new RouterContextProvider();
      },
    });

    await Promise.resolve();
    expect(order).toEqual(['reactContext']);

    release({ api: 'server-api' });
    await pending;

    expect(order).toEqual(['reactContext', 'routerContext', 'query']);
  });

  it('fails the document when getClientContext rejects', async () => {
    const error = new Error('clientContext failed');
    let laterGetterCalled = false;

    await expect(
      render({
        siteStaticHandlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite,
        getClientContext: () => Promise.reject(error),
        getReactContext: () => {
          laterGetterCalled = true;
          return { api: 'server-api' };
        },
      }),
    ).rejects.toBe(error);

    expect(laterGetterCalled).toBe(false);
  });

  it('fails the document when getReactContext rejects', async () => {
    const error = new Error('reactContext failed');
    let routerContextCalled = false;

    await expect(
      render({
        siteStaticHandlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite,
        getClientContext,
        getReactContext: () => Promise.reject(error),
        getRouterContext: () => {
          routerContextCalled = true;
          return new RouterContextProvider();
        },
      }),
    ).rejects.toBe(error);

    expect(routerContextCalled).toBe(false);
  });

  it('renders resolved values from Promise-returning getters', async () => {
    const result = await render({
      siteStaticHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      getClientContext: async () => ({ userId: 'async-user' }),
      getReactContext: async () => ({ api: 'async-api' }),
    });

    if ('response' in result) {
      throw new Error('Expected a streamed document, not a Response');
    }

    const html = await commitToHtml(result);
    expect(html).toContain('>async-user<');
    expect(html).toContain('>async-api<');
  });

  it('never creates a static handler on the request path', async () => {
    const renderSource = await readFile(
      new URL('./render.tsx', import.meta.url),
      'utf-8',
    );
    const streamSource = await readFile(
      new URL('./streamDocument.tsx', import.meta.url),
      'utf-8',
    );
    const attemptSource = await readFile(
      new URL('./createDocumentAttempt.tsx', import.meta.url),
      'utf-8',
    );

    expect(renderSource).not.toContain('createStaticHandler');
    expect(streamSource).not.toContain('createStaticHandler');
    expect(attemptSource).not.toContain('createStaticHandler');
    expect(attemptSource).toContain('SkuProvider');
    expect(attemptSource).toContain('HeadAssetsProvider');
  });

  it('uses the sole config site when getSite is omitted', async () => {
    const result = await render({
      siteStaticHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      // no getSite — sole key in siteStaticHandlers
    });

    if ('response' in result) {
      throw new Error('Expected a streamed document, not a Response');
    }

    const html = await commitToHtml(result);
    expect(html).toContain('__SKU_SITE__');
    expect(html).toContain('"au"');
  });

  it('fails closed when getSite returns an unknown site', async () => {
    await expect(
      render({
        siteStaticHandlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite: () => 'uk',
      }),
    ).rejects.toThrow(
      /SSR has no pre-built route tree for site 'uk'\. Unknown or invalid 'site'\./,
    );
  });

  it('recovers sync render throws via a second ErrorBoundary pass', async () => {
    const Boom = () => {
      throw new Error('Boom from render');
    };
    const ErrorBoundary = () => (
      <main data-testid="error-boundary">Boom recovered</main>
    );
    const handlers = buildSiteStaticHandlers({
      au: [
        {
          Component: RootLayout,
          children: [
            {
              ErrorBoundary,
              children: [{ index: true, Component: Boom }],
            },
          ],
        },
      ],
    });

    const result = await render({
      siteStaticHandlers: handlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
    });

    if ('response' in result) {
      throw new Error('Expected a streamed document, not a Response');
    }

    expect(result.statusCode).toBe(500);

    const html = await commitToHtml(result);
    expect(html).toContain('data-testid="error-boundary"');
    expect(html).toContain('Boom recovered');
  });

  it('recovers waitForAll Suspense rejections via a second ErrorBoundary pass', async () => {
    const getRejected = () =>
      new Promise<string>((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Boom from suspense'));
        }, 20);
      });

    let pending: Promise<string> | undefined;
    const DeferredBoom = () => {
      pending ??= getRejected();
      return <p>{use(pending)}</p>;
    };
    const ErrorBoundary = () => (
      <main data-testid="error-boundary">Suspense recovered</main>
    );
    const handlers = buildSiteStaticHandlers({
      au: [
        {
          Component: RootLayout,
          children: [
            {
              ErrorBoundary,
              children: [
                {
                  index: true,
                  Component: () => (
                    <Suspense fallback={<p>Loading</p>}>
                      <DeferredBoom />
                    </Suspense>
                  ),
                  handle: { waitForAll: true },
                },
              ],
            },
          ],
        },
      ],
    });

    const result = await render({
      siteStaticHandlers: handlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
    });

    if ('response' in result) {
      throw new Error('Expected a streamed document, not a Response');
    }

    expect(result.statusCode).toBe(500);

    const html = await commitToHtml(result);
    expect(html).toContain('data-testid="error-boundary"');
    expect(html).toContain('Suspense recovered');
  });

  it('rejects promptly when the render signal is already aborted', async () => {
    const controller = new AbortController();
    const reason = new Error('already gone');
    controller.abort(reason);

    await expect(
      render({
        siteStaticHandlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite,
        options: { signal: controller.signal },
      }),
    ).rejects.toBe(reason);
  });

  it('aborts waitForAll without ErrorBoundary recovery when the signal aborts', async () => {
    let errorBoundaryRendered = false;
    const ErrorBoundary = () => {
      errorBoundaryRendered = true;
      return <main data-testid="error-boundary">should-not-render</main>;
    };
    let markPendingStarted!: () => void;
    const pendingStarted = new Promise<void>((resolve) => {
      markPendingStarted = resolve;
    });
    const Pending = () => {
      markPendingStarted();
      return <p>{use(neverResolving())}</p>;
    };
    const handlers = buildSiteStaticHandlers({
      au: [
        {
          Component: RootLayout,
          children: [
            {
              ErrorBoundary,
              children: [
                {
                  index: true,
                  Component: () => (
                    <Suspense fallback={<p>Loading</p>}>
                      <Pending />
                    </Suspense>
                  ),
                  handle: { waitForAll: true },
                },
              ],
            },
          ],
        },
      ],
    });

    const controller = new AbortController();
    const reason = new Error('client disconnect');
    const pending = render({
      siteStaticHandlers: handlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      options: { signal: controller.signal },
    });

    // Abort only once the route has suspended, so the assertion never races
    // the first render pass.
    await pendingStarted;
    controller.abort(reason);

    await expect(pending).rejects.toBe(reason);
    expect(errorBoundaryRendered).toBe(false);
  });

  it('does not run actions when the render signal is already aborted', async () => {
    let actionCalled = false;
    const handlers = buildSiteStaticHandlers({
      au: [
        {
          path: '/',
          Component: Page,
          action: () => {
            actionCalled = true;
            return null;
          },
        },
      ],
    });
    const controller = new AbortController();
    const reason = new Error('already gone');
    controller.abort(reason);

    await expect(
      render({
        siteStaticHandlers: handlers,
        request: new Request('http://localhost/', { method: 'POST' }),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite,
        options: { signal: controller.signal },
      }),
    ).rejects.toBe(reason);
    expect(actionCalled).toBe(false);
  });

  it('rejects waitForAll when the render deadline elapses without ErrorBoundary recovery', async () => {
    let errorBoundaryRendered = false;
    const ErrorBoundary = () => {
      errorBoundaryRendered = true;
      return <main data-testid="error-boundary">should-not-render</main>;
    };
    const handlers = buildSiteStaticHandlers({
      au: [
        {
          Component: RootLayout,
          children: [
            {
              ErrorBoundary,
              children: [
                {
                  index: true,
                  Component: () => (
                    <Suspense fallback={<p>Loading</p>}>
                      <p>{use(neverResolving())}</p>
                    </Suspense>
                  ),
                  handle: { waitForAll: true },
                },
              ],
            },
          ],
        },
      ],
    });

    await expect(
      render({
        siteStaticHandlers: handlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite,
        options: { renderTimeoutMs: 80 },
      }),
    ).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(errorBoundaryRendered).toBe(false);
  });

  it('aborts an ErrorBoundary recovery attempt without hanging', async () => {
    let markRecoveryStarted!: () => void;
    const recoveryStarted = new Promise<void>((resolve) => {
      markRecoveryStarted = resolve;
    });
    const Boom = () => {
      throw new Error('Boom from render');
    };
    const PendingRecovery = () => {
      markRecoveryStarted();
      return <p>{use(neverResolving())}</p>;
    };
    const ErrorBoundary = () => (
      <Suspense fallback={<p>Loading recovery</p>}>
        <PendingRecovery />
      </Suspense>
    );
    const handlers = buildSiteStaticHandlers({
      au: [
        {
          Component: RootLayout,
          children: [
            {
              ErrorBoundary,
              children: [
                {
                  index: true,
                  Component: Boom,
                  handle: { waitForAll: true },
                },
              ],
            },
          ],
        },
      ],
    });

    const controller = new AbortController();
    const reason = new Error('client disconnect during recovery');
    const pending = render({
      siteStaticHandlers: handlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      options: { signal: controller.signal },
    });

    await recoveryStarted;
    controller.abort(reason);

    await expect(pending).rejects.toBe(reason);
  });

  describe('document head contribution', () => {
    it('streams root-layout html with HeadAssets links inside head and no wrapping sku html', async () => {
      const CustomRootLayout = () => (
        <html lang="en" data-custom-root="true">
          <head>
            <title>Custom Title</title>
            <HeadAssets />
          </head>
          <body>
            <Outlet />
          </body>
        </html>
      );

      const handlers = buildSiteStaticHandlers({
        au: [
          {
            Component: CustomRootLayout,
            children: [{ index: true, Component: () => <p>Content</p> }],
          },
        ],
      });

      const result = await render({
        siteStaticHandlers: handlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets: {
          css: ['/app.css', '/virtual-ssr.css'],
          modulePreloads: ['/vendor.js'],
          bootstrapModules: [],
          ssrCssHref: '/virtual-ssr.css',
        },
        getSite,
      });

      if ('response' in result) {
        throw new Error('Expected streamed document');
      }

      const html = await commitToHtml(result);

      // Emits root layout's html with attributes
      expect(html).toContain('<html lang="en" data-custom-root="true">');
      // No double/wrapping html tag
      expect(html.match(/<html/g)).toHaveLength(1);
      // HeadAssets links appear inside head
      const headStart = html.indexOf('<head>');
      const headEnd = html.indexOf('</head>');
      const cssLink = html.indexOf('<link rel="stylesheet" href="/app.css"/>');
      const ssrCssLink = html.indexOf(
        '<link rel="stylesheet" href="/virtual-ssr.css" data-ssr-css="true"/>',
      );
      const preloadLink = html.indexOf(
        '<link rel="modulepreload" href="/vendor.js"/>',
      );

      expect(headStart).toBeGreaterThan(-1);
      expect(headEnd).toBeGreaterThan(headStart);
      expect(cssLink).toBeGreaterThan(headStart);
      expect(cssLink).toBeLessThan(headEnd);
      expect(ssrCssLink).toBeGreaterThan(headStart);
      expect(ssrCssLink).toBeLessThan(headEnd);
      expect(preloadLink).toBeGreaterThan(headStart);
      expect(preloadLink).toBeLessThan(headEnd);
    });

    it('renders a non-hoistable style in head under an app provider that wraps html', async () => {
      const BrandContext = createContext('default-brand');

      const BrandProvider = ({ children }: { children: ReactNode }) => (
        <BrandContext.Provider value="seek-jobs">
          {children}
        </BrandContext.Provider>
      );

      const BrandStyle = () => {
        const brand = useContext(BrandContext);
        return (
          <style data-testid="brand-style">{`@font-face { font-family: ${brand}; }`}</style>
        );
      };

      const WrappedRootLayout = () => (
        <BrandProvider>
          <html lang="en">
            <head>
              <BrandStyle />
              <HeadAssets />
            </head>
            <body>
              <Outlet />
            </body>
          </html>
        </BrandProvider>
      );

      const handlers = buildSiteStaticHandlers({
        au: [
          {
            Component: WrappedRootLayout,
            children: [{ index: true, Component: () => <p>Content</p> }],
          },
        ],
      });

      const result = await render({
        siteStaticHandlers: handlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite,
      });

      if ('response' in result) {
        throw new Error('Expected streamed document');
      }

      const html = await commitToHtml(result);
      const headStart = html.indexOf('<head>');
      const headEnd = html.indexOf('</head>');
      const styleIndex = html.indexOf('data-testid="brand-style"');

      expect(styleIndex).toBeGreaterThan(headStart);
      expect(styleIndex).toBeLessThan(headEnd);
      expect(html).toContain('font-family: seek-jobs');
    });

    it('does not throw when HeadAssets is omitted and omits sku asset links', async () => {
      const RootLayoutWithoutHeadAssets = () => (
        <html lang="en">
          <head>
            <title>No Assets</title>
          </head>
          <body>
            <Outlet />
          </body>
        </html>
      );

      const handlers = buildSiteStaticHandlers({
        au: [
          {
            Component: RootLayoutWithoutHeadAssets,
            children: [{ index: true, Component: () => <p>Content</p> }],
          },
        ],
      });

      const result = await render({
        siteStaticHandlers: handlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets: {
          css: ['/app.css'],
          modulePreloads: ['/vendor.js'],
          bootstrapModules: [],
        },
        getSite,
      });

      if ('response' in result) {
        throw new Error('Expected streamed document');
      }

      const html = await commitToHtml(result);
      expect(html).toContain('<title>No Assets</title>');
      expect(html).not.toContain('/app.css');
      expect(html).not.toContain('/vendor.js');
    });

    it('retains root-layout html when an ErrorBoundary on a child route catches an error', async () => {
      const CustomDocLayout = () => (
        <html lang="en" data-layout="root">
          <head>
            <HeadAssets />
          </head>
          <body>
            <Outlet />
          </body>
        </html>
      );

      const ErrorBoundary = () => (
        <div data-testid="error-message">Route error caught</div>
      );
      const Boom = () => {
        throw new Error('Child route explosion');
      };

      const handlers = buildSiteStaticHandlers({
        au: [
          {
            Component: CustomDocLayout,
            children: [
              {
                ErrorBoundary,
                children: [{ index: true, Component: Boom }],
              },
            ],
          },
        ],
      });

      const result = await render({
        siteStaticHandlers: handlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite,
      });

      if ('response' in result) {
        throw new Error('Expected streamed document');
      }

      expect(result.statusCode).toBe(500);

      const html = await commitToHtml(result);
      expect(html).toContain('<html lang="en" data-layout="root">');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toContain('data-testid="error-message"');
      expect(html).toContain('Route error caught');
    });
  });
});
