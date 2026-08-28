import { useEffect } from 'react';
import { Outlet } from 'react-router';

import { AppNav } from './AppNav.js';

declare global {
  interface Window {
    __SKU_LOGGING_HYDRATED__?: boolean;
  }
}

export const RootLayout = () => {
  // Set after commit so React Router has taken over <Link> clicks. Clicking
  // before this yields a full document navigation with no client spans.
  useEffect(() => {
    window.__SKU_LOGGING_HYDRATED__ = true;
  }, []);

  return (
    <div>
      <AppNav />
      <Outlet />
    </div>
  );
};
