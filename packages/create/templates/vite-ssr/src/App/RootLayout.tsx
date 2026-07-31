import { Outlet } from 'react-router';

/**
 * Your app's root layout route. Wrapping that needs React Router hooks or loader
 * data goes here (page chrome, locale from the URL, …) — `Providers` render
 * outside the router and cannot use them.
 */
export const RootLayout = () => <Outlet />;
