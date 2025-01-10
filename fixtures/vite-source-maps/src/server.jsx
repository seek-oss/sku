import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { preloadAll, ChunkCollectorContext } from 'sku/vite-preload';

import App from './App';

export async function render({ options, collector }) {
  await preloadAll();

  return renderToPipeableStream(
    <React.StrictMode>
      <ChunkCollectorContext collector={collector}>
        <App />
      </ChunkCollectorContext>
    </React.StrictMode>,
    options,
  );
}
