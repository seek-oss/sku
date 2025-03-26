import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { App } from './App';

export default ({ site }: { site: string }) => {
  hydrateRoot(
    document.getElementById('root')!,
    <StrictMode>
      <BrowserRouter>
        <App site={site || 'au'} />
      </BrowserRouter>
    </StrictMode>,
  );
};
