import type { DocumentAssets } from './types.js';

export const SKU_STYLESHEET_PRECEDENCE = 'sku';

/**
 * Sku-owned CSS and modulepreload links. Mounted beside the router so React
 * hoists them into the app `<head>`. Not a public `sku/runtime` export.
 */
export const DocumentAssetLinks = ({ assets }: { assets: DocumentAssets }) => (
  <>
    {assets.modulePreloads.map((href) => (
      <link key={href} rel="modulepreload" href={href} />
    ))}
    {assets.css.map((href) => (
      <link
        key={href}
        rel="stylesheet"
        href={href}
        precedence={SKU_STYLESHEET_PRECEDENCE}
        {...(href === assets.ssrCssHref ? { 'data-ssr-css': true } : {})}
      />
    ))}
  </>
);
