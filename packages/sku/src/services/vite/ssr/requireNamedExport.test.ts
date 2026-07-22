import { describe, expect, it } from 'vitest';
import { requireNamedExport } from './requireNamedExport.js';

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

  it('returns routes when exported as an array (including empty)', () => {
    expect(
      requireNamedExport<unknown[]>({ routes: [] }, 'routes', 'serverEntry', {
        kind: 'array',
      }),
    ).toEqual([]);
  });

  it('hard-errors when routes is missing on serverEntry', () => {
    expect(() =>
      requireNamedExport(
        { onRequest: () => ({}), middleware: [] },
        'routes',
        'serverEntry',
        { kind: 'array' },
      ),
    ).toThrow(
      /Vite SSR serverEntry must export named 'routes' as an array\. Missing or non-array 'routes' export\./,
    );
  });

  it('hard-errors when routes is missing on clientEntry', () => {
    expect(() =>
      requireNamedExport({ onHydrate: () => ({}) }, 'routes', 'clientEntry', {
        kind: 'array',
      }),
    ).toThrow(
      /Vite SSR clientEntry must export named 'routes' as an array\. Missing or non-array 'routes' export\./,
    );
  });

  it('hard-errors when routes is not an array', () => {
    expect(() =>
      requireNamedExport({ routes: { path: '/' } }, 'routes', 'serverEntry', {
        kind: 'array',
      }),
    ).toThrow(
      /Vite SSR serverEntry must export named 'routes' as an array\. Missing or non-array 'routes' export\./,
    );
  });
});
