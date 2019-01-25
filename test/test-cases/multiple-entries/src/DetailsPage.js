import React from 'react';
import { hydrate } from 'react-dom';
import { loadableReady } from '@loadable/component';
import Details from './handlers/Details';

loadableReady(() => {
  hydrate(
    <Details site={window.APP_CONFIG.site} />,
    document.getElementById('app')
  );
});
