import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import { preloadAll } from 'sku/vite-preload';

import App from './App';
import { HydrateSafeRouter } from './HydrateSafeRouter.jsx';

const client = async ({ site, initialRoute }) => {
  hydrateRoot(
    document.getElementById('root'),
    <StrictMode>
      <HydrateSafeRouter initialRoute={initialRoute}>
        <App site={site} />
      </HydrateSafeRouter>
    </StrictMode>,
  );
};

export default client;
