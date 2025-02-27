import './index.css';
import { type ComponentType, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import { loadable } from 'sku/vite/loadable';

type SiteObject = {
  home: string;
  details: string;
};

const routes: Record<string, SiteObject> = {
  au: {
    home: '/',
    details: '/details/:id',
  },
  nz: {
    home: '/nz',
    details: '/nz/details/:id',
  },
};

const slowLoad = (
  fn: () => Promise<{ default: ComponentType<any> }>,
): Promise<{ default: ComponentType<any> }> =>
  new Promise((resolve) => setTimeout(() => resolve(fn()), 1000));

const Home = loadable(() => slowLoad(() => import('./handlers/Home')));
const Details = loadable(() => slowLoad(() => import('./handlers/Details')));

export const App = ({ site }: { site: string }) => (
  <>
    <div>I&#39;m an app! 🚀</div>
    <Routes>
      <Route
        path={routes[site].home}
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <Home site={site} />
          </Suspense>
        }
      />
      <Route
        path={routes[site].details}
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <Details site={site} />
          </Suspense>
        }
      />
    </Routes>
  </>
);
