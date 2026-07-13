import { Outlet, Link } from 'react-router';

export const RootLayout = () => (
  <>
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>"
    />
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/details">Details</Link>
        <Link to="/en/hello">Hello (en)</Link>
        <Link to="/fr/hello">Hello (fr)</Link>
      </nav>
      <Outlet />
    </div>
  </>
);
