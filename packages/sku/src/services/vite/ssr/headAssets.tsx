import { createContext, useContext, type ReactNode } from 'react';
import type { DocumentAssets } from './types.js';
import { SSR_CSS_VIRTUAL_HREF } from '../plugins/ssrCss/constants.js';

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

export const HeadAssets = () => {
  const assets = useContext(HeadAssetsContext);

  if (!assets) {
    return null;
  }

  return (
    <>
      {assets.modulePreloads?.map((href) => (
        <link key={href} rel="modulepreload" href={href} />
      ))}
      {assets.css?.map((href) => (
        <link
          key={href}
          rel="stylesheet"
          href={href}
          {...(href === SSR_CSS_VIRTUAL_HREF ? { 'data-ssr-css': true } : {})}
        />
      ))}
    </>
  );
};
