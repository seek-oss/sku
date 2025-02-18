import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import type { ViteRender } from 'sku';

import { App } from './App.jsx';

export default {
  render: async ({ options, renderContext }) => {
    console.log('RenderContext is still unused', renderContext);

    return renderToPipeableStream(
      <StrictMode>
        <App />
      </StrictMode>,
      options,
    );
  },
} satisfies ViteRender;
