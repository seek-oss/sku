import { hydrateRoot } from 'react-dom/client';

import { App } from './App.tsx';

export default () => {
  hydrateRoot(document.getElementById('app'), <App />);

  window.injected();
  window.someRandomApi();
};
