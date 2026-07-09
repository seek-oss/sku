import { hydrateRoot } from 'react-dom/client';

import App from './app.tsx';

export default () => {
  hydrateRoot(document.getElementById('app')!, <App />);
};
