import type { SkuContext } from './createSkuContext.js';

/**
 * Gets the site name for a given hostname.
 * If no site is found (i.e., localhost), it will return the default site or the first site if no default site is provided.
 */
export const getSiteForHost = (
  hostname: string,
  defaultSite: string | undefined,
  sites: SkuContext['sites'],
) => {
  if (sites.length === 0) {
    return undefined;
  }

  const matchingSite = sites.find((site) => site.host === hostname);

  if (matchingSite) {
    return matchingSite.name;
  }

  return defaultSite ? defaultSite : sites[0].name;
};
