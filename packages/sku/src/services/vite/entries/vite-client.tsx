// '__sku_alias__clientEntry' is a vite alias
// pointing to the consuming apps client entry
import client from '__sku_alias__clientEntry';

if (process.env.NODE_ENV === 'development') {
  if (typeof client !== 'function') {
    throw new Error(require('dedent')`
      The sku client entry ('${__SKU_CLIENT_PATH__}') must export a function that calls hydrateRoot. e.g.

      import { hydrateRoot } from 'react-dom/client';

      import App from './App';

      export default ({ site }) =>
        hydrateRoot(
          document.getElementById('app')!,
          <App site={site} />,
        );

      See https://seek-oss.github.io/sku/#/./docs/building-the-app?id=client for more info.
  `);
  }
}

let clientContext = {};

const dataElement = document.getElementById('__SKU_CLIENT_CONTEXT__');
if (dataElement) {
  clientContext = JSON.parse(dataElement.textContent || '{}');
}

client(clientContext);
