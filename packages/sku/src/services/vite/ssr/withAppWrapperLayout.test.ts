import { describe, expect, it } from 'vitest';
import type { ComponentType, ReactNode } from 'react';
import type { RouteObject } from 'react-router';

import {
  SKU_APP_WRAPPER_ROUTE_ID,
  withAppWrapperLayout,
} from './withAppWrapperLayout.js';

const AppWrapper: ComponentType<{ children: ReactNode }> = ({ children }) =>
  children;

describe('withAppWrapperLayout', () => {
  const routes: RouteObject[] = [{ path: '/', Component: () => null }];

  it('returns routes unchanged when AppWrapper is omitted', () => {
    expect(withAppWrapperLayout(routes, undefined)).toBe(routes);
  });

  it('wraps routes in a stable pathless parent when AppWrapper is provided', () => {
    const wrapped = withAppWrapperLayout(routes, AppWrapper);

    expect(wrapped).toHaveLength(1);
    expect(wrapped[0]).toMatchObject({
      id: SKU_APP_WRAPPER_ROUTE_ID,
      children: routes,
    });
    expect(wrapped[0].Component).toBeTypeOf('function');
  });
});
