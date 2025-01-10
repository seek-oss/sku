import { hydrateRoot } from 'react-dom/client';

import App from './App';

const client = ({ site }) =>
  hydrateRoot(document.getElementById('root'), <App themeName={site} />);

client({ site: 'seekAnz' });
