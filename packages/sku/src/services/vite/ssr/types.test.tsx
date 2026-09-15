import { describe, expect, expectTypeOf, it } from 'vitest';

import type { SkuChildRouteObject, SkuRouteObject } from './types.js';

describe('SkuRouteObject error UI', () => {
  // eslint-disable-next-line vitest/expect-expect
  it('forbids ErrorBoundary on the html route', () => {
    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        // @ts-expect-error -- ErrorBoundary replaces the html layout
        ErrorBoundary: () => null,
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
  });

  // eslint-disable-next-line vitest/expect-expect
  it('forbids errorElement on the html route', () => {
    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        // @ts-expect-error -- errorElement replaces the html layout
        errorElement: <div />,
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
  });

  // eslint-disable-next-line vitest/expect-expect
  it('forbids errorElement from html-route lazy()', () => {
    const routes: SkuRouteObject[] = [
      {
        // @ts-expect-error -- lazy errorElement replaces the html layout
        lazy: async () => ({
          errorElement: <div />,
        }),
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
  });

  // eslint-disable-next-line vitest/expect-expect
  it('forbids errorElement on html-route lazy object', () => {
    const routes: SkuRouteObject[] = [
      {
        lazy: {
          // @ts-expect-error -- lazy errorElement replaces the html layout
          errorElement: async () => <div />,
        },
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
  });

  it('allows ErrorBoundary on a child route', () => {
    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        children: [{ ErrorBoundary: () => null }],
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
    expect(routes[0]?.children).toHaveLength(1);
  });

  it('allows errorElement on a child route', () => {
    const errorElement = <div />;
    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        children: [{ errorElement }],
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
    expect(routes[0]?.children?.[0]?.errorElement).toBe(errorElement);
  });

  it('allows errorElement from a child-route lazy()', () => {
    const errorElement = <div />;
    const routes: SkuRouteObject[] = [
      {
        Component: () => null,
        children: [
          {
            lazy: async () => ({ errorElement }),
          },
        ],
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
    expect(routes[0]?.children).toHaveLength(1);
  });

  it('allows html-route lazy() that returns Component', () => {
    const Component = () => null;
    const routes: SkuRouteObject[] = [
      {
        lazy: async () => ({ Component }),
      },
    ];

    expectTypeOf(routes).toEqualTypeOf<SkuRouteObject[]>();
    expect(routes[0]?.lazy).toBeTypeOf('function');
  });

  it('allows ErrorBoundary on a child of SkuRouteObject', () => {
    const child: SkuChildRouteObject = { ErrorBoundary: () => null };
    expect(child.ErrorBoundary).toBeTypeOf('function');
  });

  it('allows errorElement on a child of SkuRouteObject', () => {
    const errorElement = <div />;
    const child: SkuChildRouteObject = { errorElement };
    expect(child.errorElement).toBe(errorElement);
  });
});
