/* eslint-disable react/jsx-no-bind */
import React, { Fragment } from 'react';
import { Route } from 'react-router-dom';
import loadable from '../../../../@loadable/component';

const Home = loadable(() => import('./handlers/Home'));
const Details = loadable(() => import('./handlers/Details'));

export default ({ site }) => (
  <Fragment>
    <Route path="/" exact render={() => <Home site={site} />} />
    <Route path="/details/:id" render={() => <Details site={site} />} />
  </Fragment>
);
