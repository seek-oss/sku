import { Link, Outlet } from 'react-router';
import { HeadAssets } from 'sku/runtime';

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
        <Link to="/">Home</Link>
        <Link to="/about" data-testid="nav-about">
          About
        </Link>
        <Link to="/context-user" data-testid="nav-context-user">
          Context user
        </Link>
      </nav>
      <Outlet />
    </body>
  </html>
);
