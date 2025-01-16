import { hydrateRoot } from 'react-dom/client';

import App from './App';

// Expect error when running start. Better way to run start?
const client = ({ site }) =>
  hydrateRoot(document.getElementById('root'), <App themeName={site} />);

let clientContext = {};

const dataElement = document.getElementById('__SKU_CLIENT_CONTEXT__');
if (dataElement) {
  clientContext = JSON.parse(dataElement.textContent || '{}');
}

client(clientContext);
