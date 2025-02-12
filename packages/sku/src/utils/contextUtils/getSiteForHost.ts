import type { SkuContext } from '@/context/createSkuContext.js';

const getSiteForHost = (
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

export default getSiteForHost;
