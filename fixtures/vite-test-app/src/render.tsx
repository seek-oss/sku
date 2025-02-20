import React, { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import type { ViteRender } from 'sku';
import { LoadableProvider, preloadAll } from 'sku/vite/loadable';

import { App } from './App.jsx';

export default {
  render: async ({ options, renderContext, site, url }) => {
    const { loadableCollector } = renderContext;

    await preloadAll();

    const appSite = typeof site === 'string' ? site : site?.name;

    return renderToPipeableStream(
      <StrictMode>
        <LoadableProvider value={loadableCollector!}>
          <StaticRouter location={url || '/'}>
            <App site={appSite || ''} />
          </StaticRouter>
        </LoadableProvider>
      </StrictMode>,
      options,
    );
  },

  provideClientContext: async ({ site }) => ({
    site: typeof site === 'string' ? site : site?.name,
  }),
} satisfies ViteRender;
