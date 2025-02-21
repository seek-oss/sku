import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import type { ViteRenderServer } from 'sku';

import { App } from './App.jsx';

export default {
  render: async ({ options, renderContext, site, url }) => {
    console.log('SSR rendered', renderContext);

    const appSite = typeof site === 'string' ? site : site?.name;

    return renderToPipeableStream(
      <StrictMode>
        <StaticRouter location={url || '/'}>
          <App site={appSite || ''} />
        </StaticRouter>
      </StrictMode>,
      options,
    );
  },

  provideClientContext: async ({ site }) => ({
    site: typeof site === 'string' ? site : site?.name,
  }),
} satisfies ViteRenderServer;
