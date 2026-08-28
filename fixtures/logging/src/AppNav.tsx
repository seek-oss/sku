import { Link } from 'react-router';

export const AppNav = () => (
  <nav>
    <Link to="/" data-testid="nav-home">
      Home
    </Link>{' '}
    <Link to="/loader-error" data-testid="nav-loader-error">
      Loader error
    </Link>{' '}
    <Link to="/action-error" data-testid="nav-action-error">
      Action error
    </Link>{' '}
    <Link to="/render-error" data-testid="nav-render-error">
      Render error
    </Link>{' '}
    <Link to="/suspense-error" data-testid="nav-suspense-error">
      Suspense error
    </Link>
  </nav>
);
