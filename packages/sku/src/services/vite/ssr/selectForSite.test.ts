import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router';
import { selectForSite } from './selectForSite.js';

const siteRouteTrees: Record<string, RouteObject[]> = {
  au: [{ path: '/au-only' }],
  nz: [{ path: '/nz-only' }],
};

describe('selectForSite', () => {
  it('returns the site tree when present', () => {
    expect(selectForSite(siteRouteTrees, 'au', 'getSite')).toEqual([
      { path: '/au-only' },
    ]);
  });

  it('hard-errors when site is missing or not a string', () => {
    expect(() => selectForSite(siteRouteTrees, undefined, 'getSite')).toThrow(
      /must provide a non-empty string 'site'/,
    );
    expect(() => selectForSite(siteRouteTrees, '', 'getSite')).toThrow(
      /must provide a non-empty string 'site'/,
    );
    expect(() => selectForSite(siteRouteTrees, 1, 'hydrate bootstrap')).toThrow(
      /hydrate bootstrap.*'site'/,
    );
  });

  it('hard-errors when there is no pre-built tree for site', () => {
    expect(() => selectForSite(siteRouteTrees, 'uk', 'getSite')).toThrow(
      /no pre-built route tree for site 'uk'/,
    );
  });

  it('hard-errors for inherited Object properties rather than returning them', () => {
    expect(() =>
      selectForSite(siteRouteTrees, 'constructor', 'getSite'),
    ).toThrow(/no pre-built route tree for site 'constructor'/);
  });
});
