import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { loadableReady } from 'sku/@loadable/component';

import App from './App';

loadableReady(() => {
  hydrateRoot(document.getElementById('app'), <App />);
});
