import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import type { ViteRender } from 'sku';

import { App } from './App.jsx';

export default {
  render: async ({ options, renderContext, site, url }) => {
    console.log('RenderContext is still unused', renderContext);

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
} satisfies ViteRender;
