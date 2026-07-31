import { Outlet, Link } from 'react-router';

/**
 * Pathless root layout so it reads as a layout and keeps wrapping any future
 * root-level sibling; child paths stay relative.
 */
export const RootLayout = () => (
  <div>
    <nav>
      <Link to="/" data-testid="nav-products">
        Products
      </Link>{' '}
      <Link to="/reviews" data-testid="nav-reviews">
        Reviews
      </Link>
    </nav>
    <Outlet />
  </div>
);
