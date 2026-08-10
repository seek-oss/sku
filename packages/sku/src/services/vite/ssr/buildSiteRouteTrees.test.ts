import { matchRoutes } from 'react-router';
import { describe, expect, it } from 'vitest';
import {
  buildSiteRouteTrees,
  buildRoutesForSite,
} from './buildSiteRouteTrees.js';
import { optionalNamedFunction } from './requireNamedExport.js';
import type { MapRoutePath, SkuRouteObject } from './types.js';

describe('buildRoutesForSite', () => {
  it('includes routes that omit sites for every site', () => {
    const routes: SkuRouteObject[] = [{ path: '/' }, { path: '/shared' }];
    expect(buildRoutesForSite(routes, 'au')).toEqual([
      { path: '/', caseSensitive: true },
      { path: '/shared', caseSensitive: true },
    ]);
    expect(buildRoutesForSite(routes, 'nz')).toEqual([
      { path: '/', caseSensitive: true },
      { path: '/shared', caseSensitive: true },
    ]);
  });

  it('includes routes only for sites listed in sites', () => {
    const routes: SkuRouteObject[] = [
      { path: '/shared' },
      { path: '/au-only', sites: ['au'] },
      { path: '/nz-only', sites: ['nz'] },
    ];
    expect(buildRoutesForSite(routes, 'au')).toEqual([
      { path: '/shared', caseSensitive: true },
      { path: '/au-only', caseSensitive: true },
    ]);
    expect(buildRoutesForSite(routes, 'nz')).toEqual([
      { path: '/shared', caseSensitive: true },
      { path: '/nz-only', caseSensitive: true },
    ]);
  });

  it('strips sites before returning RouteObjects', () => {
    const routes: SkuRouteObject[] = [{ path: '/au-only', sites: ['au'] }];
    expect(buildRoutesForSite(routes, 'au')[0]).not.toHaveProperty('sites');
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
    expect(buildRoutesForSite(routes, 'nz')).toEqual([]);

    // Parent included for au; child omitting sites is still included (no inheritance
    // means omit ⇒ all-sites, and parent already passed the filter).
    expect(buildRoutesForSite(routes, 'au')).toEqual([
      {
        path: '/',
        caseSensitive: true,
        children: [{ path: 'au-child', caseSensitive: true }],
      },
    ]);
  });
});

describe('caseSensitive default', () => {
  it('fills omitted caseSensitive to true so /About does not match about', () => {
    const tree = buildRoutesForSite([{ path: 'about' }], 'au');

    expect(tree).toEqual([{ path: 'about', caseSensitive: true }]);
    expect(matchRoutes(tree, '/about')).not.toBeNull();
    expect(matchRoutes(tree, '/About')).toBeNull();
  });

  it('preserves explicit caseSensitive false', () => {
    const tree = buildRoutesForSite(
      [{ path: 'about', caseSensitive: false }],
      'au',
    );

    expect(tree).toEqual([{ path: 'about', caseSensitive: false }]);
    expect(matchRoutes(tree, '/about')).not.toBeNull();
    expect(matchRoutes(tree, '/About')).not.toBeNull();
  });

  it('preserves explicit caseSensitive true', () => {
    expect(
      buildRoutesForSite([{ path: 'about', caseSensitive: true }], 'au'),
    ).toEqual([{ path: 'about', caseSensitive: true }]);
  });

  it('fills caseSensitive on mapRoutePath clones', () => {
    const mapRoutePath: MapRoutePath = ({ path }) =>
      path === 'about' ? ['about', 'fr/about'] : [path];

    const tree = buildRoutesForSite([{ path: 'about' }], 'au', mapRoutePath);

    expect(tree).toEqual([
      { path: 'about', caseSensitive: true },
      { path: 'fr/about', caseSensitive: true },
    ]);
  });
});

describe('mapRoutePath', () => {
  const aboutLazy = () => Promise.resolve({ Component: () => null });

  it('leaves paths unchanged when mapRoutePath is omitted', () => {
    const routes: SkuRouteObject[] = [{ path: 'about', lazy: aboutLazy }];
    expect(buildRoutesForSite(routes, 'au')).toEqual([
      { path: 'about', lazy: aboutLazy, caseSensitive: true },
    ]);
  });

  it('duplicates a path when mapRoutePath returns multiple paths', () => {
    const mapRoutePath: MapRoutePath = ({ path, site, parentSegments }) => {
      if (parentSegments.length > 0) {
        return [path];
      }
      if (path === 'about' && site === 'th') {
        return ['th/about', 'about'];
      }
      return [path];
    };

    const routes: SkuRouteObject[] = [
      {
        path: 'about',
        lazy: aboutLazy,
        handle: { moduleId: 'src/pages/about/about.tsx' },
      },
    ];

    const thTree = buildRoutesForSite(routes, 'th', mapRoutePath);
    expect(thTree).toEqual([
      {
        path: 'th/about',
        lazy: aboutLazy,
        handle: { moduleId: 'src/pages/about/about.tsx' },
        caseSensitive: true,
      },
      {
        path: 'about',
        lazy: aboutLazy,
        handle: { moduleId: 'src/pages/about/about.tsx' },
        caseSensitive: true,
      },
    ]);
    // Same lazy + handle reference on each clone (preload-safe).
    expect(thTree[0]?.lazy).toBe(aboutLazy);
    expect(thTree[1]?.lazy).toBe(aboutLazy);
    expect(thTree[0]?.handle).toBe(routes[0]?.handle);
    expect(thTree[1]?.handle).toBe(routes[0]?.handle);
  });

  it('passes source parentSegments for nested path-bearing ancestors', () => {
    const calls: Array<{
      path: string;
      parentSegments: string[];
    }> = [];

    const mapRoutePath: MapRoutePath = (args) => {
      calls.push({ path: args.path, parentSegments: args.parentSegments });
      if (args.parentSegments.length > 0) {
        return [args.path];
      }
      if (args.path === 'account') {
        return ['th/account', 'account'];
      }
      return [args.path];
    };

    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        children: [
          {
            path: 'account',
            children: [{ path: 'settings' }],
          },
        ],
      },
    ];

    const tree = buildRoutesForSite(routes, 'th', mapRoutePath);

    expect(calls).toEqual([
      { path: 'account', parentSegments: [] },
      { path: 'settings', parentSegments: ['account'] },
      { path: 'settings', parentSegments: ['account'] },
    ]);
    expect(tree).toEqual([
      {
        Component: routes[0]?.Component,
        caseSensitive: true,
        children: [
          {
            path: 'th/account',
            caseSensitive: true,
            children: [{ path: 'settings', caseSensitive: true }],
          },
          {
            path: 'account',
            caseSensitive: true,
            children: [{ path: 'settings', caseSensitive: true }],
          },
        ],
      },
    ]);
  });

  it('omits a route when mapRoutePath returns an empty array', () => {
    const mapRoutePath: MapRoutePath = ({ path, site }) =>
      path === 'hidden' && site === 'nz' ? [] : [path];

    const routes: SkuRouteObject[] = [{ path: 'shared' }, { path: 'hidden' }];

    expect(buildRoutesForSite(routes, 'nz', mapRoutePath)).toEqual([
      { path: 'shared', caseSensitive: true },
    ]);
    expect(buildRoutesForSite(routes, 'au', mapRoutePath)).toEqual([
      { path: 'shared', caseSensitive: true },
      { path: 'hidden', caseSensitive: true },
    ]);
  });

  it('does not call mapRoutePath for pathless layout routes', () => {
    const calls: string[] = [];
    const mapRoutePath: MapRoutePath = ({ path }) => {
      calls.push(path);
      return [path];
    };

    const leaf = { path: 'leaf', Component: () => null };
    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        children: [leaf],
      },
    ];

    expect(buildRoutesForSite(routes, 'au', mapRoutePath)).toEqual([
      {
        Component: routes[0]?.Component,
        caseSensitive: true,
        children: [
          {
            path: 'leaf',
            Component: leaf.Component,
            caseSensitive: true,
          },
        ],
      },
    ]);
    // Pathless parent is skipped; only the leaf is expanded.
    expect(calls).toEqual(['leaf']);
  });

  it('leaves index unchanged when mapRoutePath is omitted', () => {
    const home = { index: true as const, lazy: aboutLazy };
    expect(buildRoutesForSite([home], 'au')).toEqual([
      { ...home, caseSensitive: true },
    ]);
  });

  it("expands an index home with path: '' into index + path clones", () => {
    const mapRoutePath: MapRoutePath = ({ path, parentSegments }) => {
      if (parentSegments.length > 0) {
        return [path];
      }
      if (path === '') {
        return ['', 'fr'];
      }
      return [path];
    };

    const homeLazy = () => Promise.resolve({ Component: () => null });
    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        children: [
          {
            index: true,
            lazy: homeLazy,
            handle: { moduleId: 'src/pages/home/home.tsx' },
          },
        ],
      },
    ];

    const tree = buildRoutesForSite(routes, 'au', mapRoutePath);
    expect(tree).toEqual([
      {
        Component: routes[0]?.Component,
        caseSensitive: true,
        children: [
          {
            index: true,
            lazy: homeLazy,
            handle: { moduleId: 'src/pages/home/home.tsx' },
            caseSensitive: true,
          },
          {
            path: 'fr',
            lazy: homeLazy,
            handle: { moduleId: 'src/pages/home/home.tsx' },
            caseSensitive: true,
          },
        ],
      },
    ]);
    const clones = tree[0]?.children ?? [];
    expect(clones[0]).not.toHaveProperty('path');
    expect(clones[1]).not.toHaveProperty('index');
    expect(clones[0]?.lazy).toBe(homeLazy);
    expect(clones[1]?.lazy).toBe(homeLazy);
    expect(clones[0]?.handle).toBe(routes[0]?.children?.[0]?.handle);
    expect(clones[1]?.handle).toBe(routes[0]?.children?.[0]?.handle);
  });

  it('does not re-map clones from a prior mapping', () => {
    const calls: string[] = [];
    const mapRoutePath: MapRoutePath = ({ path }) => {
      calls.push(path);
      if (path === '') {
        return ['', 'fr'];
      }
      return [path];
    };

    buildRoutesForSite(
      [{ index: true, Component: () => null }],
      'au',
      mapRoutePath,
    );

    // Called once on the source index — never again on the '' or 'fr' clones.
    expect(calls).toEqual(['']);
  });

  it('hard-errors when mapRoutePath returns a non-string array', () => {
    const mapRoutePath = (() => [1, 2]) as unknown as MapRoutePath;
    expect(() =>
      buildRoutesForSite([{ path: 'about' }], 'au', mapRoutePath),
    ).toThrow(
      /SSR routesEntry mapRoutePath must return string\[\]\. Invalid return for path 'about' on site 'au'\./,
    );
  });

  it('hard-errors when mapRoutePath is present but not a function', () => {
    expect(() =>
      optionalNamedFunction(
        { mapRoutePath: 'nope' },
        'mapRoutePath',
        'routesEntry',
      ),
    ).toThrow(
      /SSR routesEntry must export named 'mapRoutePath' as a function when present\. Invalid 'mapRoutePath' export\./,
    );
  });

  it('returns undefined when mapRoutePath is omitted', () => {
    expect(
      optionalNamedFunction({}, 'mapRoutePath', 'routesEntry'),
    ).toBeUndefined();
  });
});

describe('buildSiteRouteTrees', () => {
  const routes: SkuRouteObject[] = [
    { path: '/shared' },
    { path: '/au-only', sites: ['au'] },
  ];

  it('pre-builds a tree per config site name', () => {
    expect(buildSiteRouteTrees(routes, ['au', 'nz'])).toEqual({
      au: [
        { path: '/shared', caseSensitive: true },
        { path: '/au-only', caseSensitive: true },
      ],
      nz: [{ path: '/shared', caseSensitive: true }],
    });
  });

  it('never wraps a site tree — providers render outside the router', () => {
    const trees = buildSiteRouteTrees(routes, ['au', 'nz']);

    expect(trees.au.map(({ path }) => path)).toEqual(['/shared', '/au-only']);
    expect(trees.nz.map(({ path }) => path)).toEqual(['/shared']);
  });

  it('applies mapRoutePath after sites membership filtering', () => {
    const mapRoutePath: MapRoutePath = ({ path, site }) => {
      if (path === 'about' && site === 'au') {
        return ['about', 'au/about'];
      }
      return [path];
    };

    const trees = buildSiteRouteTrees(
      [{ path: 'about' }, { path: 'nz-only', sites: ['nz'] }],
      ['au', 'nz'],
      mapRoutePath,
    );

    expect(trees).toEqual({
      au: [
        { path: 'about', caseSensitive: true },
        { path: 'au/about', caseSensitive: true },
      ],
      nz: [
        { path: 'about', caseSensitive: true },
        { path: 'nz-only', caseSensitive: true },
      ],
    });
  });
});
