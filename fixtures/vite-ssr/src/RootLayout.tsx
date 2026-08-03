import { VocabProvider } from '@vocab/react';
import { Outlet, useLocation } from 'react-router';

import { PreloadingLink } from './PreloadingLink.js';
import { languageFromPath } from './config.js';

import * as styles from './layout.css';

/**
 * App-owned pathless layout route: router-aware wrapping lives here so
 * language tracks client navigation. Request seeds come from SkuProvider.
 */
export const RootLayout = () => {
  const { pathname } = useLocation();
  const language = languageFromPath(pathname);

  return (
    <VocabProvider language={language}>
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>"
      />
      <div className={styles.root}>
        <nav>
          <PreloadingLink to="/">Home</PreloadingLink>
          <PreloadingLink to="/about" data-testid="nav-about">
            About
          </PreloadingLink>
          <PreloadingLink to="/details" data-testid="nav-details">
            Details
          </PreloadingLink>
          <PreloadingLink to="/context-user" data-testid="nav-context-user">
            Context user
          </PreloadingLink>
          {/* Rendered on every site so hovering it on AU proves a foreign-site
            path is never warmed. */}
          <PreloadingLink to="/nz-only" data-testid="nav-nz-only">
            NZ only
          </PreloadingLink>
          <PreloadingLink to="/en/hello">Hello (en)</PreloadingLink>
          <PreloadingLink to="/fr/hello">Hello (fr)</PreloadingLink>
        </nav>
        <Outlet />
      </div>
    </VocabProvider>
  );
};
