import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router';
import { selectSiteRoutes } from './selectSiteRoutes.js';

const siteRouteTrees: Record<string, RouteObject[]> = {
  au: [{ path: '/au-only' }],
  nz: [{ path: '/nz-only' }],
};

describe('selectSiteRoutes', () => {
  it('returns the site tree when present', () => {
    expect(selectSiteRoutes(siteRouteTrees, 'au', 'onRequest')).toEqual([
      { path: '/au-only' },
    ]);
  });

  it('hard-errors when site is missing or not a string', () => {
    expect(() =>
      selectSiteRoutes(siteRouteTrees, undefined, 'onRequest'),
    ).toThrow(/must provide a non-empty string 'site'/);
    expect(() => selectSiteRoutes(siteRouteTrees, '', 'onRequest')).toThrow(
      /must provide a non-empty string 'site'/,
    );
    expect(() =>
      selectSiteRoutes(siteRouteTrees, 1, 'hydrate bootstrap'),
    ).toThrow(/hydrate bootstrap.*'site'/);
  });

  it('hard-errors when there is no pre-built tree for site', () => {
    expect(() => selectSiteRoutes(siteRouteTrees, 'uk', 'onRequest')).toThrow(
      /no pre-built route tree for site 'uk'/,
    );
  });
});
