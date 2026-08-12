import { Link, Outlet } from 'react-router';

export const RootLayout = () => (
  <>
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>"
    />
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
  </>
);
