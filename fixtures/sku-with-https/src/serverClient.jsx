import { hydrateRoot } from 'react-dom';
import { loadableReady } from 'sku/@loadable/component';

import App from './App';

loadableReady(() => {
  hydrateRoot(document.getElementById('app'), <App />);
});
