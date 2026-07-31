/**
 * Config site names used to pre-build Vite SSR route trees.
 * Vite SSR requires a non-empty config `sites` (≥1 site name) — empty is a hard error.
 */
export const resolveConfigSiteNames = (
  sites: ReadonlyArray<{ name: string }>,
): string[] => {
  if (sites.length === 0) {
    throw new Error(
      "Vite SSR requires a non-empty config 'sites' array (≥1 site name).",
    );
  }
  return sites.map((site) => site.name);
};
