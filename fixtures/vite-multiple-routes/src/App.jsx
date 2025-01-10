import { Routes, Route } from 'react-router-dom';
import { lazy } from 'sku/vite-preload';

const routes = {
  au: {
    home: '/',
    details: '/details/:id',
  },
  nz: {
    home: '/nz',
    details: '/nz/details/:id',
  },
};

const Home = lazy(() => import('./handlers/Home'));
const Details = lazy(() => import('./handlers/Details'));

export default ({ site }) => {
  return (
    <Routes>
      <Route path={routes[site].home} element={<Home site={site} />} />
      <Route path={routes[site].details} element={<Details site={site} />} />
    </Routes>
  );
};
