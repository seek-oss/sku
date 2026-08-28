import { describe, expect, it } from 'vitest';
import { resolveConfigSiteNames } from './resolveConfigSiteNames.js';

describe('resolveConfigSiteNames', () => {
  it('returns config site names when present', () => {
    expect(resolveConfigSiteNames([{ name: 'au' }, { name: 'nz' }])).toEqual([
      'au',
      'nz',
    ]);
  });

  it('soft-defaults empty config sites to default', () => {
    expect(resolveConfigSiteNames([])).toEqual(['default']);
  });
});
