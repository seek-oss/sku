/* eslint-disable react/jsx-no-bind */
import React, { Fragment } from 'react';
import { Route } from 'react-router-dom';
import loadable from '../../../../../@loadable/component';

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
  fallback: 'Loading Home...',
});
const Details = loadable(() => import('./handlers/Details'), {
  fallback: 'Loading Details...',
});

export default ({ site }) => (
  <Fragment>
    <Route path={routes[site].home} exact render={() => <Home site={site} />} />
    <Route path={routes[site].details} render={() => <Details site={site} />} />
  </Fragment>
);
