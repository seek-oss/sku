import { hydrateRoot } from 'react-dom/client';
import { loadableReady } from 'sku/@loadable/component';

import App from './App.js';

loadableReady(() => {
  hydrateRoot(document.getElementById('app'), <App />);
});
