import { useContext } from 'react';
import {
  Link,
  matchRoutes,
  useHref,
  type LinkProps,
  type RouteObject,
} from 'react-router';

import { ClientRoutesContext } from './ClientRoutesContext.js';

function preloadLazyMatches(routes: RouteObject[], pathname: string) {
  const matches = matchRoutes(routes, pathname) ?? [];
  for (const { route } of matches) {
    if (typeof route.lazy === 'function') {
      // Dynamic import is cached by the module graph — navigation's later
      // lazy() call resolves from cache.
      route.lazy();
    }
  }
}

/**
 * On hover / focus / touch, warms lazy route modules for the destination.
 */
export function PreloadingLink({
  to,
  onFocus,
  onMouseEnter,
  onTouchStart,
  ...rest
}: LinkProps) {
  const routes = useContext(ClientRoutesContext);
  const href = useHref(to);

  const warm = () => {
    if (!routes) {
      return;
    }
    preloadLazyMatches(routes, href);
  };

  return (
    <Link
      to={to}
      onFocus={(event) => {
        warm();
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        warm();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        warm();
        onTouchStart?.(event);
      }}
      {...rest}
    />
  );
}
