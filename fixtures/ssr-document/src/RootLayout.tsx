import { Link, Outlet } from 'react-router';

import * as styles from './layout.css';

export const RootLayout = () => (
  <>
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>"
    />
    <div className={styles.root}>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about" data-testid="nav-about">
          About
        </Link>
        <Link to="/details" data-testid="nav-details">
          Details
        </Link>
      </nav>
      <Outlet />
    </div>
  </>
);
