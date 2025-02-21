import './index.css';
import { Routes, Route } from 'react-router';

import Details from './handlers/Details';
import Home from './handlers/Home';

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

export const App = ({ site }: { site: string }) => (
  <>
    <div>I&#39;m an app! 🚀</div>
    <Routes>
      <Route path={routes[site].home} element={<Home site={site} />} />
      <Route path={routes[site].details} element={<Details site={site} />} />
    </Routes>
  </>
);
