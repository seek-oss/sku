import { describe, expect, expectTypeOf, it } from 'vitest';

import type { SkuChildRouteObject, SkuRouteObject } from './types.js';

describe('SkuRouteObject ErrorBoundary', () => {
  // eslint-disable-next-line vitest/expect-expect
  it('forbids ErrorBoundary on the html route', () => {
    expectTypeOf<{
      ErrorBoundary: () => null;
    }>().not.toExtend<SkuRouteObject>();

    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        // @ts-expect-error -- ErrorBoundary replaces the html layout
        ErrorBoundary: () => null,
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
  });

  it('allows ErrorBoundary on a child route', () => {
    expectTypeOf<{
      children: [{ ErrorBoundary: () => null }];
    }>().toExtend<SkuRouteObject>();

    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        children: [{ ErrorBoundary: () => null }],
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
    expect(routes[0]?.children).toHaveLength(1);
  });

  it('allows ErrorBoundary on a child of SkuRouteObject', () => {
    expectTypeOf<{
      ErrorBoundary: () => null;
    }>().toExtend<SkuChildRouteObject>();

    const child: SkuChildRouteObject = { ErrorBoundary: () => null };
    expect(child.ErrorBoundary).toBeTypeOf('function');
  });
});
