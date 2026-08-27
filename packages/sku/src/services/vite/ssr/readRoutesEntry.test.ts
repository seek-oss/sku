import { describe, expect, it } from 'vitest';
import { readRoutesEntry } from './readRoutesEntry.js';

describe('readRoutesEntry', () => {
  it('returns the routes array and mapRoutePath when both are valid', () => {
    const routes = [{ path: '/' }];
    const mapRoutePath = () => ['/'];
    expect(readRoutesEntry({ routes, mapRoutePath })).toEqual({
      routes,
      mapRoutePath,
    });
  });

  it('returns undefined mapRoutePath when omitted', () => {
    const routes = [{ path: '/' }];
    expect(readRoutesEntry({ routes }).mapRoutePath).toBeUndefined();
  });

  it('hard-errors when routes is missing', () => {
    expect(() => readRoutesEntry({})).toThrowErrorMatchingInlineSnapshot(
      `[Error: routesEntry must export named 'routes' as an array. Missing or non-array 'routes' export.]`,
    );
  });

  it('hard-errors when routes is not an array', () => {
    expect(() =>
      readRoutesEntry({ routes: { au: [] } }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: routesEntry must export named 'routes' as an array. Missing or non-array 'routes' export.]`,
    );
  });

  it('hard-errors when mapRoutePath is present but not a function', () => {
    expect(() =>
      readRoutesEntry({ routes: [], mapRoutePath: 'nope' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: routesEntry must export named 'mapRoutePath' as a function when present. Invalid 'mapRoutePath' export.]`,
    );
  });
});
