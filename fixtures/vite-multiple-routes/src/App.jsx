import { Routes, Route } from 'react-router-dom';
import { loadable } from 'sku/@vite-preload';

import { TestComponent } from './TestComponent.jsx';

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

const Home = loadable(() => import('./handlers/Home'));
const Details = loadable(() => import('./handlers/Details'));

export default ({ site }) => {
  return (
    <div>
      <TestComponent />
      <Routes>
        <Route path={routes[site].home} element={<Home site={site} />} />
        <Route path={routes[site].details} element={<Details site={site} />} />
      </Routes>
    </div>
  );
};
