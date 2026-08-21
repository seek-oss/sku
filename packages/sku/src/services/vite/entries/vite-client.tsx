import 'virtual:sku/polyfills';
import client from '__sku_alias__clientEntry';
import dedent from 'dedent';

if (process.env.NODE_ENV === 'development') {
  if (typeof client !== 'function') {
    throw new Error(dedent`
      The sku client entry ('${__SKU_CLIENT_PATH__}') must export a function that calls hydrateRoot. e.g.

      import { hydrateRoot } from 'react-dom/client';

      import App from './App';

      export default ({ site }) =>
        hydrateRoot(
          document.getElementById('app')!,
          <App site={site} />,
        );

      See https://seek-oss.github.io/sku/building-the-app#client for more info.
  `);
  }
}

const waitForLoadableChunks = async () => {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[data-chunk][src]',
  );

  await Promise.all(
    Array.from(scripts, (script) => import(/* @vite-ignore */ script.src)),
  );
};

const startClient = async () => {
  await waitForLoadableChunks();

  let clientContext = {};

  const dataElement = document.getElementById('__SKU_CLIENT_CONTEXT__');
  if (dataElement) {
    clientContext = JSON.parse(dataElement.textContent || '{}');
  }

  client(clientContext);
};

startClient();
