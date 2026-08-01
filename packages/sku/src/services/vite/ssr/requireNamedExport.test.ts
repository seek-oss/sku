import { describe, expect, it, vi } from 'vitest';
import type { RequestHandler } from 'express';
import {
  optionalEntryFunction,
  optionalEntryValue,
  optionalOrRequiredEntryFunction,
  rejectRoutesBySiteExport,
  requireDefaultEntry,
  requireNamedExport,
} from './requireNamedExport.js';
import { mountConsumerMiddleware } from './ssrServerShared.js';

describe('requireNamedExport', () => {
  it('returns the named export when present', () => {
    const getSite = () => 'au';
    expect(
      requireNamedExport<() => string>({ getSite }, 'getSite', 'serverEntry', {
        kind: 'function',
      }),
    ).toBe(getSite);
  });

  it('hard-errors when the named export is missing', () => {
    expect(() =>
      requireNamedExport({ getSite: () => 'au' }, 'routes', 'routesEntry', {
        kind: 'routes',
      }),
    ).toThrow(
      /Vite SSR routesEntry must export named 'routes' as an array\. Missing or non-array 'routes' export\./,
    );
  });

  it('hard-errors when a required function export is not a function', () => {
    expect(() =>
      requireNamedExport({ getSite: 'nope' }, 'getSite', 'serverEntry', {
        kind: 'function',
      }),
    ).toThrow(/Vite SSR serverEntry must export named 'getSite' as a function/);
  });

  it('returns routes when exported as an array', () => {
    const routes = [{ path: '/' }];
    expect(
      requireNamedExport<unknown[]>({ routes }, 'routes', 'routesEntry', {
        kind: 'routes',
      }),
    ).toBe(routes);
  });

  it('hard-errors when routes is missing on routesEntry', () => {
    expect(() =>
      requireNamedExport({}, 'routes', 'routesEntry', { kind: 'routes' }),
    ).toThrow(
      /Vite SSR routesEntry must export named 'routes' as an array\. Missing or non-array 'routes' export\./,
    );
  });

  it('hard-errors when routes is not an array', () => {
    expect(() =>
      requireNamedExport({ routes: { au: [] } }, 'routes', 'routesEntry', {
        kind: 'routes',
      }),
    ).toThrow(/Vite SSR routesEntry must export named 'routes' as an array/);
  });
});

describe('rejectRoutesBySiteExport', () => {
  it('allows routesEntry without a routesBySite export', () => {
    expect(() =>
      rejectRoutesBySiteExport({ routes: [] }, 'routesEntry'),
    ).not.toThrow();
  });

  it('hard-errors when routesBySite is exported on routesEntry', () => {
    expect(() =>
      rejectRoutesBySiteExport({ routesBySite: { au: [] } }, 'routesEntry'),
    ).toThrow(
      /Vite SSR routesEntry must not export named 'routesBySite'\. Export flat 'routes' with optional 'sites' membership on routesEntry instead\./,
    );
  });
});

describe('requireDefaultEntry', () => {
  it('returns the default-exported object', () => {
    const entry = { getSite: () => 'au' };
    expect(requireDefaultEntry({ default: entry }, 'serverEntry')).toBe(entry);
  });

  it('hard-errors when the default export is missing', () => {
    expect(() => requireDefaultEntry({}, 'serverEntry')).toThrow(
      /Vite SSR serverEntry must export default an object/,
    );
  });

  it('hard-errors when the default export is not an object', () => {
    expect(() =>
      requireDefaultEntry({ default: () => 'au' }, 'clientEntry'),
    ).toThrow(/Vite SSR clientEntry must export default an object/);
  });
});

describe('optionalEntryFunction / optionalOrRequiredEntryFunction', () => {
  it('requires getSite on the entry object when multi-site', () => {
    expect(() =>
      optionalOrRequiredEntryFunction({}, 'getSite', 'serverEntry', true),
    ).toThrow(
      /Vite SSR serverEntry must include 'getSite' as a function on its default export/,
    );
  });

  it('allows omitting getSite on single-site', () => {
    expect(
      optionalOrRequiredEntryFunction({}, 'getSite', 'serverEntry', false),
    ).toBeUndefined();
  });

  it('returns getSite when present on single-site', () => {
    const getSite = () => 'au';
    expect(
      optionalOrRequiredEntryFunction(
        { getSite },
        'getSite',
        'serverEntry',
        false,
      ),
    ).toBe(getSite);
  });

  it('returns undefined for optional getters that are omitted', () => {
    expect(optionalEntryFunction({}, 'getReactContext')).toBeUndefined();
  });
});

describe('optionalEntryValue', () => {
  it('returns middleware when present on the entry object', () => {
    const middleware: RequestHandler[] = [];
    expect(optionalEntryValue({ middleware }, 'middleware')).toBe(middleware);
  });

  it('returns undefined when middleware is omitted', () => {
    expect(optionalEntryValue({}, 'middleware')).toBeUndefined();
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
