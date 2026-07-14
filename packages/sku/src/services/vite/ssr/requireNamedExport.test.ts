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
});
