import React from 'react';
import { hydrate } from 'react-dom';
import Details from './handlers/Details';

hydrate(
  <Details site={window.APP_CONFIG.site} />,
  document.getElementById('app')
);
