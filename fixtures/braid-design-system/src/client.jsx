import { hydrateRoot } from 'react-dom/client';

import { App } from './App.jsx';

export default ({ site, rootElementId }) =>
  hydrateRoot(document.getElementById(rootElementId), <App themeName={site} />);
