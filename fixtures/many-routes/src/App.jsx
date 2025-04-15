import { Routes, Route } from 'react-router-dom';
import loadable from 'sku/@loadable/component';

const routes = {
  au: {
    home: '/',
    one: '/one',
    two: '/two',
    three: '/three',
    four: '/four',
    five: '/five',
    six: '/six',
    seven: '/seven',
    eight: '/eight',
    nine: '/nine',
  },
  nz: {
    home: '/nz',
    one: '/nz/one',
    two: '/nz/two',
    three: '/nz/three',
    four: '/nz/four',
    five: '/nz/five',
    six: '/nz/six',
    seven: '/nz/seven',
    eight: '/nz/eight',
    nine: '/nz/nine',
  },
};

const Home = loadable(() => import('./handlers/Home'), {
  fallback: <div>Loading Home...</div>,
});
const One = loadable(() => import('./handlers/One'), {
  fallback: <div>Loading One...</div>,
});
const Two = loadable(() => import('./handlers/Two'), {
  fallback: <div>Loading Two...</div>,
});
const Three = loadable(() => import('./handlers/Three'), {
  fallback: <div>Loading Three...</div>,
});
const Four = loadable(() => import('./handlers/Four'), {
  fallback: <div>Loading Four...</div>,
});
const Five = loadable(() => import('./handlers/Five'), {
  fallback: <div>Loading Five...</div>,
});
const Six = loadable(() => import('./handlers/Six'), {
  fallback: <div>Loading Six...</div>,
});
const Seven = loadable(() => import('./handlers/Seven'), {
  fallback: <div>Loading Seven...</div>,
});
const Eight = loadable(() => import('./handlers/Eight'), {
  fallback: <div>Loading Eight...</div>,
});
const Nine = loadable(() => import('./handlers/Nine'), {
  fallback: <div>Loading Nine...</div>,
});

export default ({ site }) => (
  <Routes>
    <Route path={routes[site].home} element={<Home site={site} />} />
    <Route path={routes[site].one} element={<One site={site} />} />
    <Route path={routes[site].two} element={<Two site={site} />} />
    <Route path={routes[site].three} element={<Three site={site} />} />
    <Route path={routes[site].four} element={<Four site={site} />} />
    <Route path={routes[site].five} element={<Five site={site} />} />
    <Route path={routes[site].six} element={<Six site={site} />} />
    <Route path={routes[site].seven} element={<Seven site={site} />} />
    <Route path={routes[site].eight} element={<Eight site={site} />} />
    <Route path={routes[site].nine} element={<Nine site={site} />} />
  </Routes>
);
