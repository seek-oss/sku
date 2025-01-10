import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

const client = async ({ site }) => {
  hydrateRoot(
    document.getElementById('root'),
    <BrowserRouter>
      <App site={site} />
    </BrowserRouter>,
  );
};

let clientContext = {};

const dataElement = document.getElementById('__SKU_CLIENT_CONTEXT__');
if (dataElement) {
  clientContext = JSON.parse(dataElement.textContent || '{}');
}

client(clientContext);
