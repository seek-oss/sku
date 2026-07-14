import { Outlet, type RouteObject } from 'react-router';

import type { SkuSsrAppWrapper } from './types.js';

/** Stable route id so server/client hydration shapes stay aligned. */
export const SKU_APP_WRAPPER_ROUTE_ID = '__sku_app_wrapper__';

/**
 * Mount `AppWrapper` as a pathless parent layout under the router so it can
 * use React Router hooks (`useLocation`, etc.). When omitted, routes are unchanged.
 */
export const withAppWrapperLayout = (
  routes: RouteObject[],
  AppWrapper: SkuSsrAppWrapper | undefined,
): RouteObject[] => {
  if (!AppWrapper) {
    return routes;
  }

  return [
    {
      id: SKU_APP_WRAPPER_ROUTE_ID,
      Component: function SkuAppWrapperLayout() {
        return (
          <AppWrapper>
            <Outlet />
          </AppWrapper>
        );
      },
      children: routes,
    },
  ];
};
