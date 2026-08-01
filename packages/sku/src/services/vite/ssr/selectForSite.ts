type SiteSource = 'getSite' | 'config sites' | 'hydrate bootstrap';

/** Narrow an incoming `site` to a usable name, failing closed when it is not. */
export function assertSiteName(
  site: unknown,
  source: SiteSource,
): asserts site is string {
  if (typeof site !== 'string' || site.length === 0) {
    throw new Error(
      `Vite SSR ${source} must provide a non-empty string 'site'. Missing or invalid 'site'.`,
    );
  }
}

/**
 * Select a pre-built per-site value — the client's route tree or the server's
 * static handler. Missing or non-string `site`, or a missing map entry, fails closed.
 */
export const selectForSite = <T>(
  siteMap: Record<string, T>,
  site: unknown,
  source: SiteSource,
): T => {
  assertSiteName(site, source);

  if (!Object.prototype.hasOwnProperty.call(siteMap, site)) {
    throw new Error(
      `Vite SSR has no pre-built route tree for site '${site}'. Unknown or invalid 'site'.`,
    );
  }

  return siteMap[site];
};
