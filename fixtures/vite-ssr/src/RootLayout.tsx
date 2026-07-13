import { VocabProvider } from '@vocab/react';
import { Outlet, Link, useParams } from 'react-router';

export const RootLayout = () => {
  const { language = 'en' } = useParams();

  return (
    <VocabProvider language={language}>
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
    </VocabProvider>
  );
};
