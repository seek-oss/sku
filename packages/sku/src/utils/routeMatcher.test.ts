import { describe, it, expect } from 'vitest';

import { getMatchingRoute, routeMatcher } from './routeMatcher.js';

describe('routeMatcher', () => {
  it('matches static routes', () => {
    const match = routeMatcher('/about');

    expect(match('/about')).toMatchObject({ params: {} });
    expect(match('/about/team')).toBe(false);
    expect(match('/')).toBe(false);
  });

  it('matches routes using $ params', () => {
    const match = routeMatcher('/details/$id');

    expect(match('/details/123')).toMatchObject({
      params: { id: '123' },
    });
    expect(match('/details/')).toBe(false);
    expect(match('/details/123/extra')).toBe(false);
  });

  it('matches routes using : params', () => {
    const match = routeMatcher('/details/:id');

    expect(match('/details/456')).toMatchObject({
      params: { id: '456' },
    });
    expect(match('/details/')).toBe(false);
    expect(match('/details/456/extra')).toBe(false);
  });

  it('matches routes using a * splat', () => {
    const match = routeMatcher('/docs/$param/*splat');

    expect(match('/docs/getting-started/install/part1')).toMatchObject({
      params: { param: 'getting-started', splat: ['install', 'part1'] },
    });
    expect(match('/docs/')).toBeFalsy();
  });

  it('matches multiple dynamic segments', () => {
    const match = routeMatcher('/$language/profile/:id');

    expect(match('/en-AU/profile/123')).toMatchObject({
      params: { language: 'en-AU', id: '123' },
    });
    expect(match('/profile')).toBe(false);
  });
});

describe('getMatchingRoute', () => {
  const sites = [
    { name: 'au', host: 'dev.seek.com.au' },
    { name: 'nz', host: 'dev.seek.co.nz' },
  ];

  it('returns the first matching route for a path', () => {
    const routes = [
      { route: '/', name: 'home' },
      { route: '/details/$id', name: 'details' },
    ];

    expect(
      getMatchingRoute({
        routes,
        hostname: 'dev.seek.com.au',
        path: '/details/123',
        sites,
      }),
    ).toEqual(routes[1]);
  });

  it('skips routes that belong to another site', () => {
    const routes = [
      { route: '/', name: 'au-home', siteIndex: 0 },
      { route: '/nz', name: 'nz-home', siteIndex: 1 },
    ];

    expect(
      getMatchingRoute({
        routes,
        hostname: 'dev.seek.com.au',
        path: '/',
        sites,
      }),
    ).toEqual(routes[0]);

    expect(
      getMatchingRoute({
        routes,
        hostname: 'dev.seek.com.au',
        path: '/nz',
        sites,
      }),
    ).toBeUndefined();
  });
});
