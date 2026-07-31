import { describe, expect, it } from 'vitest';
import { resolveConfigSiteNames } from './resolveConfigSiteNames.js';

describe('resolveConfigSiteNames', () => {
  it('returns config site names when present', () => {
    expect(resolveConfigSiteNames([{ name: 'au' }, { name: 'nz' }])).toEqual([
      'au',
      'nz',
    ]);
  });

  it('hard-errors when config sites is empty', () => {
    expect(() => resolveConfigSiteNames([])).toThrow(
      /Vite SSR requires a non-empty config 'sites' array/,
    );
  });
});
