import { hydrateRoot } from 'react-dom/client';

import App from './app.jsx';

export default () => {
  hydrateRoot(document.getElementById('app'), <App />);
};
