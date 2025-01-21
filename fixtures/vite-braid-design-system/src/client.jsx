import { hydrateRoot } from 'react-dom/client';

import App from './App';

// Expect error when running start. Better way to run start?
const client = ({ site }) =>
  hydrateRoot(document.getElementById('root'), <App themeName={site.name} />);

export default client;
