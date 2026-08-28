import type { RouteObject } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as PreloadRouteModule from './preloadRoute.js';

let preloadRoute: typeof PreloadRouteModule;

const lazyPage = (Component: () => null) => vi.fn(async () => ({ Component }));

const Home = () => null;
const About = () => null;
const NzOnly = () => null;

beforeEach(async () => {
  // The registered tree is module state, so each test starts from "unregistered".
  vi.resetModules();
  preloadRoute = await import('./preloadRoute.js');
});

describe('preloadMatchedRoutes', () => {
  it('warms a matched function lazy route', () => {
    const about = lazyPage(About);
    const routes: RouteObject[] = [
      {
        children: [
          { index: true, Component: Home },
          { path: 'about', lazy: about },
        ],
      },
    ];

    preloadRoute.preloadMatchedRoutes(routes, '/about');

    expect(about).toHaveBeenCalledTimes(1);
  });

  it('warms every property of an object lazy route', () => {
    const loadComponent = vi.fn(async () => About);
    const loadLoader = vi.fn(async () => () => null);
    const routes: RouteObject[] = [
      {
        path: 'about',
        lazy: { Component: loadComponent, loader: loadLoader },
      } as RouteObject,
    ];

    preloadRoute.preloadMatchedRoutes(routes, '/about');

    expect(loadComponent).toHaveBeenCalledTimes(1);
    expect(loadLoader).toHaveBeenCalledTimes(1);
  });

  it('does not warm a path outside the tree', () => {
    const nzOnly = lazyPage(NzOnly);
    // The AU site tree never contains the NZ-only route.
    const auRoutes: RouteObject[] = [
      { children: [{ index: true, Component: Home }] },
    ];

    preloadRoute.preloadMatchedRoutes(auRoutes, '/nz-only');

    expect(nzOnly).not.toHaveBeenCalled();
  });

  it('swallows a rejected warm-up', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const routes: RouteObject[] = [
      { path: 'about', lazy: () => Promise.reject(new Error('chunk failed')) },
    ];

    preloadRoute.preloadMatchedRoutes(routes, '/about');
    await new Promise((resolve) => setImmediate(resolve));
    process.off('unhandledRejection', unhandled);

    expect(unhandled).not.toHaveBeenCalled();
  });
});

describe('preloadHref', () => {
  it('is a silent no-op when no route tree is registered', () => {
    const warn = vi.fn();

    // No `document` in this environment — outside SSR / during server render.
    preloadRoute.preloadHref('/about', warn);

    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once in development when invoked on the client without a tree', () => {
    const warn = vi.fn();
    vi.stubGlobal('document', {});

    preloadRoute.preloadHref('/about', warn);
    preloadRoute.preloadHref('/details', warn);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('usePreloadRoute');
    vi.unstubAllGlobals();
  });

  it('warms the registered tree', () => {
    const about = lazyPage(About);
    preloadRoute.registerSiteRouteTree([{ path: 'about', lazy: about }]);

    preloadRoute.preloadHref('/about');

    expect(about).toHaveBeenCalledTimes(1);
  });
});
