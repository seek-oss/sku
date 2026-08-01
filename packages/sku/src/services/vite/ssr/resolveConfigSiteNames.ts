/**
 * Config site names used to pre-build Vite SSR route trees.
 * Empty or omitted `sites` soft-defaults to a single synthetic name `'default'`.
 */
export const resolveConfigSiteNames = (
  sites: ReadonlyArray<{ name: string }>,
): string[] => {
  if (sites.length === 0) {
    return ['default'];
  }
  return sites.map((site) => site.name);
};
