import { Outlet } from 'react-router';

import { AppNav } from './AppNav.js';

export const RootLayout = () => (
  <div>
    <AppNav />
    <Outlet />
  </div>
);
