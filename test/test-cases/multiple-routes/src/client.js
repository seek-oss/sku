import React from 'react';
import { hydrate } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { loadableReady } from '@loadable/component';

import App from './App';

loadableReady(() => {
  hydrate(
    <BrowserRouter>
      <App site={window.APP_CONFIG.site} />
    </BrowserRouter>,
    document.getElementById('app')
  );
});
