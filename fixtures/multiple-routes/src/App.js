import { Routes, Route } from 'react-router-dom';
import loadable from 'sku/@loadable/component';

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

const Home = loadable(() => import('./handlers/Home'), {
  fallback: <div>Loading Home...</div>,
});
const Details = loadable(() => import('./handlers/Details'), {
  fallback: <div>Loading Details...</div>,
});

export default ({ site }) => (
  <Routes>
    <Route path={routes[site].home} element={<Home site={site} />} />
    <Route path={routes[site].details} element={<Details site={site} />} />
  </Routes>
);
