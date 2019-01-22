import React from 'react';
import { hydrate } from 'react-dom';
import { loadableReady } from '@loadable/component';

import App from './App';

loadableReady(() => {
  hydrate(<App theme={window.SKU_SITE} />, document.getElementById('app'));
});
