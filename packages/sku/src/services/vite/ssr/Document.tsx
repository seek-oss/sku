import type { ReactNode } from 'react';
import type { DocumentAssets } from './types.js';
import { SSR_CSS_VIRTUAL_HREF } from '../plugins/ssrCss/constants.js';

interface DocumentProps {
  children: ReactNode;
  assets: DocumentAssets;
}

export const Document = ({ children, assets }: DocumentProps) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {assets.modulePreloads.map((href) => (
        <link key={href} rel="modulepreload" href={href} />
      ))}
      {assets.css.map((href) => (
        <link
          key={href}
          rel="stylesheet"
          href={href}
          {...(href === SSR_CSS_VIRTUAL_HREF ? { 'data-ssr-css': true } : {})}
        />
      ))}
    </head>
    <body>{children}</body>
  </html>
);

export default Document;
