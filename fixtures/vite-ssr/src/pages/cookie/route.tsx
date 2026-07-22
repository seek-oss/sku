import { data, type RouteObject } from 'react-router';

export const cookieRoute = {
  path: 'set-cookie',
  loader: () =>
    data(
      { ok: true },
      {
        headers: {
          'Set-Cookie': 'sku-vite-ssr=1; Path=/; HttpOnly',
        },
      },
    ),
  Component: () => <main data-testid="cookie-page">Cookie page</main>,
} satisfies RouteObject;
