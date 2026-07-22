import { Outlet } from 'react-router';

import { PreloadingLink } from './PreloadingLink.js';
import * as styles from './layout.css';

export const RootLayout = () => (
  <>
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
        <PreloadingLink to="/en/hello">Hello (en)</PreloadingLink>
        <PreloadingLink to="/fr/hello">Hello (fr)</PreloadingLink>
      </nav>
      <Outlet />
    </div>
  </>
);
