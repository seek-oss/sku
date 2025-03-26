import type { NormalizedRoute } from '@/context/createSkuContext.js';
import { match } from 'path-to-regexp';
import getSiteForHost from './contextUtils/getSiteForHost.js';
import type { SkuSiteObject } from '@/types/types.js';

/**
 * Finds the appropriate route for a given URL
 *
 * Note: Some routes are only available on some sites
 */
export function getMatchingRoute({
  hostname,
  path,
  routes,
  sites,
}: {
  routes: NormalizedRoute[];
  hostname: string;
  path: string;
  sites: SkuSiteObject[];
}) {
  const matchingSiteName = getSiteForHost(hostname, undefined, sites);

  return routes.find(({ route, siteIndex }) => {
    if (
      typeof siteIndex === 'number' &&
      matchingSiteName !== sites[siteIndex].name
    ) {
      return false;
    }
    return routeMatcher(route)(path);
  });
}

const routeMatcher = (route: string) => {
  const normalisedRoute = route
    .split('/')
    .map((part) => {
      if (part.startsWith('$')) {
        // Path is dynamic, map to ':id' style syntax supported by pathToRegexp
        return `:${part.slice(1)}`;
      }

      return part;
    })
    .join('/');

  return match<Record<string, string>>(normalisedRoute);
};

export default routeMatcher;
