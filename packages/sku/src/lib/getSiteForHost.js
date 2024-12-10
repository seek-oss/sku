// @ts-check
import { sites } from '../context/index.js';

/**
 * @param {string} hostname
 * @param {string | undefined} defaultSite
 */
const getSiteForHost = (hostname, defaultSite) => {
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
