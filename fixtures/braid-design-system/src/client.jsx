import { hydrateRoot } from 'react-dom/client';

import App from './App';

export default ({ site}) =>
  hydrateRoot(document.getElementById('app'), <App themeName={site} />);
