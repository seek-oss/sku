import { describe, expect, it } from 'vitest';
import {
  buildSiteRouteTrees,
  filterRoutesForSite,
} from './filterRoutesForSite.js';
import type { SkuRouteObject } from './types.js';

describe('filterRoutesForSite', () => {
  it('includes routes that omit sites for every site', () => {
    const routes: SkuRouteObject[] = [{ path: '/' }, { path: '/shared' }];
    expect(filterRoutesForSite(routes, 'au')).toEqual([
      { path: '/' },
      { path: '/shared' },
    ]);
    expect(filterRoutesForSite(routes, 'nz')).toEqual([
      { path: '/' },
      { path: '/shared' },
    ]);
  });

  it('includes routes only for sites listed in sites', () => {
    const routes: SkuRouteObject[] = [
      { path: '/shared' },
      { path: '/au-only', sites: ['au'] },
      { path: '/nz-only', sites: ['nz'] },
    ];
    expect(filterRoutesForSite(routes, 'au')).toEqual([
      { path: '/shared' },
      { path: '/au-only' },
    ]);
    expect(filterRoutesForSite(routes, 'nz')).toEqual([
      { path: '/shared' },
      { path: '/nz-only' },
    ]);
  });

  it('strips sites before returning RouteObjects', () => {
    const routes: SkuRouteObject[] = [{ path: '/au-only', sites: ['au'] }];
    expect(filterRoutesForSite(routes, 'au')[0]).not.toHaveProperty('sites');
  });

  it('does not inherit sites from parent onto children', () => {
    const routes: SkuRouteObject[] = [
      {
        path: '/',
        sites: ['au'],
        children: [{ path: 'au-child' }, { path: 'nz-child', sites: ['nz'] }],
      },
    ];

    // Parent excluded for nz ⇒ whole subtree absent (structure, not inheritance).
    expect(filterRoutesForSite(routes, 'nz')).toEqual([]);

    // Parent included for au; child omitting sites is still included (no inheritance
    // means omit ⇒ all-sites, and parent already passed the filter).
    expect(filterRoutesForSite(routes, 'au')).toEqual([
      {
        path: '/',
        children: [{ path: 'au-child' }],
      },
    ]);
  });
});

describe('buildSiteRouteTrees', () => {
  const routes: SkuRouteObject[] = [
    { path: '/shared' },
    { path: '/au-only', sites: ['au'] },
  ];

  it('pre-builds a tree per config site name', () => {
    expect(buildSiteRouteTrees(routes, ['au', 'nz'])).toEqual({
      au: [{ path: '/shared' }, { path: '/au-only' }],
      nz: [{ path: '/shared' }],
    });
  });

  it('never wraps a site tree — providers render outside the router', () => {
    const trees = buildSiteRouteTrees(routes, ['au', 'nz']);

    expect(trees.au.map(({ path }) => path)).toEqual(['/shared', '/au-only']);
    expect(trees.nz.map(({ path }) => path)).toEqual(['/shared']);
  });
});
