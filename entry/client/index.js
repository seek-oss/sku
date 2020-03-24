// '__sku_alias__clientEntry' is a webpack alias
// pointing to the consuming apps client entry
import client from '__sku_alias__clientEntry';

import { loadableReady } from '../../@loadable/component';

import clientContextKey from '../clientContextKey';

if (process.env.NODE_ENV === 'development') {
  if (typeof client !== 'function') {
    throw new Error(require('dedent')`
      The sku client entry ('${__SKU_CLIENT_PATH__}') must export a function that calls hydrate. e.g.

      import React from 'react';
      import { hydrate } from 'react-dom';
          
      import App from './App';
          
      export default ({ site }) =>
        hydrate(
          <App site={site} />, 
          document.getElementById('app')
        );
  `);
  }
}

loadableReady(() => {
  let clientContext = {};

  if (window[clientContextKey]) {
    clientContext = window[clientContextKey];
    delete window[clientContextKey];
  }

  client(clientContext);
});
