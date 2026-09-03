import { Outlet } from 'react-router';
import { HeadAssets } from 'sku/runtime';

import { PreloadingLink } from './PreloadingLink.js';

/**
 * App-owned pathless layout route. The NZ-only link is rendered on every site
 * so hovering it on AU proves a foreign-site path is never warmed.
 */
export const RootLayout = () => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>"
      />
      <HeadAssets />
    </head>
    <body>
      <nav>
        <PreloadingLink to="/">Home</PreloadingLink>
        <PreloadingLink to="/about" data-testid="nav-about">
          About
        </PreloadingLink>
        <PreloadingLink to="/nz-only" data-testid="nav-nz-only">
          NZ only
        </PreloadingLink>
      </nav>
      <Outlet />
    </body>
  </html>
);
