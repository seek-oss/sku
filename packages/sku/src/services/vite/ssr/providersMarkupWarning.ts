/**
 * `Providers` render outside the router on both sides, and the two exports may
 * differ, so any DOM they emit is a hydration hazard. In development sku renders
 * each entry's `Providers` around a sentinel child and warns when anything else
 * comes out.
 */
export const PROVIDERS_PROBE_SENTINEL = '__sku_providers_probe__';

export const providersMarkupWarning = (
  entryLabel: 'serverEntry' | 'clientEntry',
): string =>
  `[sku] The Vite SSR ${entryLabel} 'Providers' export rendered DOM markup. Providers render outside the router and may differ between server and client, so they must be context-only. Move markup into your app's root layout route in routesEntry.`;

export const warnIfProbeRendersMarkup = ({
  entryLabel,
  renderProbe,
  warn = console.warn,
}: {
  entryLabel: 'serverEntry' | 'clientEntry';
  renderProbe: () => string;
  warn?: (message: string) => void;
}): void => {
  let html: string;
  try {
    html = renderProbe();
  } catch {
    // A failed probe is not a failed request — the real render reports errors.
    return;
  }

  if (html.replaceAll(PROVIDERS_PROBE_SENTINEL, '').trim() !== '') {
    warn(providersMarkupWarning(entryLabel));
  }
};
