import React from 'react';
import { hydrate } from 'react-dom';
import { loadableReady } from 'sku/@loadable/component';

import App from './App';

loadableReady(() => {
  hydrate(<App />, document.getElementById('app'));
});
