import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import type { ViteRenderServer } from 'sku';

import { App } from './App.jsx';

export default {
  render: async ({ options, renderContext }) => {
    console.log('SSR rendered', renderContext);

    return renderToPipeableStream(
      <StrictMode>
        <App />
      </StrictMode>,
      options,
    );
  },
} satisfies ViteRenderServer;
