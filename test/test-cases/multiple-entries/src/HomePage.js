import React from 'react';
import { hydrate } from 'react-dom';
import { loadableReady } from '@loadable/component';
import Home from './handlers/Home';

loadableReady(() => {
  hydrate(
    <Home site={window.APP_CONFIG.site} />,
    document.getElementById('app')
  );
});
