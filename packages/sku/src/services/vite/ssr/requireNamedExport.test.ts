import { describe, expect, it } from 'vitest';
import {
  optionalNamedComponentExport,
  optionalNamedFunctionExport,
  rejectRoutesBySiteExport,
  requireNamedExport,
} from './requireNamedExport.js';

describe('requireNamedExport', () => {
  it('returns the named export when present', () => {
    const onRequest = () => ({});
    expect(
      requireNamedExport<() => object>(
        { onRequest },
        'onRequest',
        'serverEntry',
        { kind: 'function' },
      ),
    ).toBe(onRequest);
  });

  it('hard-errors when the named export is missing', () => {
    expect(() =>
      requireNamedExport(
        { onRequest: () => ({}) },
        'middleware',
        'serverEntry',
      ),
    ).toThrow(
      /Vite SSR serverEntry must export named 'middleware'\. Missing or undefined 'middleware' export\./,
    );
  });

  it('hard-errors when a required function export is not a function', () => {
    expect(() =>
      requireNamedExport({ onHydrate: 'nope' }, 'onHydrate', 'clientEntry', {
        kind: 'function',
      }),
    ).toThrow(
      /Vite SSR clientEntry must export named 'onHydrate' as a function/,
    );
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

describe('optionalNamedFunctionExport', () => {
  it('returns the function when present', () => {
    const getContext = () => ({});
    expect(optionalNamedFunctionExport({ getContext }, 'getContext')).toBe(
      getContext,
    );
  });

  it('returns undefined when omitted (default RR context behaviour)', () => {
    expect(
      optionalNamedFunctionExport({ onRequest: () => ({}) }, 'getContext'),
    ).toBeUndefined();
  });

  it('returns undefined when the export is not a function', () => {
    expect(
      optionalNamedFunctionExport({ getContext: 'nope' }, 'getContext'),
    ).toBeUndefined();
  });
});

describe('optionalNamedComponentExport', () => {
  it('returns the component when present', () => {
    const Providers = () => null;
    expect(optionalNamedComponentExport({ Providers }, 'Providers')).toBe(
      Providers,
    );
  });

  it('returns wrapped components exported as objects', () => {
    const Providers = { $$typeof: Symbol.for('react.memo') };
    expect(optionalNamedComponentExport({ Providers }, 'Providers')).toBe(
      Providers,
    );
  });

  it('returns undefined when omitted (router rendered directly)', () => {
    expect(
      optionalNamedComponentExport({ onHydrate: () => {} }, 'Providers'),
    ).toBeUndefined();
  });

  it('returns undefined when the export is not a component', () => {
    expect(
      optionalNamedComponentExport({ Providers: 'nope' }, 'Providers'),
    ).toBeUndefined();
  });
});
