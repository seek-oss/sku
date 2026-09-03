import { createContext, useContext, type ReactNode } from 'react';
import type { DocumentAssets } from './types.js';

const HeadAssetsContext = createContext<DocumentAssets | null>(null);

export const HeadAssetsProvider = ({
  assets,
  children,
}: {
  assets: DocumentAssets;
  children: ReactNode;
}) => (
  <HeadAssetsContext.Provider value={assets}>
    {children}
  </HeadAssetsContext.Provider>
);

/**
 * Emits sku-owned CSS and modulepreload links for this document.
 * Without a provider it is a silent no-op and never throws — omitting
 * `HeadAssets` ships an unstyled document rather than failing the render.
 */
export const HeadAssets = () => {
  const assets = useContext(HeadAssetsContext);

  if (!assets) {
    return null;
  }

  return (
    <>
      {assets.modulePreloads.map((href) => (
        <link key={href} rel="modulepreload" href={href} />
      ))}
      {assets.css.map((href) => (
        <link
          key={href}
          rel="stylesheet"
          href={href}
          {...(href === assets.ssrCssHref ? { 'data-ssr-css': true } : {})}
        />
      ))}
    </>
  );
};
