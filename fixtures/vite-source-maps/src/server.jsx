import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { preloadAll } from 'sku/@vite-preload';
import { LoadableProvider } from 'sku/@vite-preload/provider';

import { App } from './App';

export async function render({ options, loadableCollector }) {
  await preloadAll();

  return renderToPipeableStream(
    <React.StrictMode>
      <LoadableProvider value={loadableCollector}>
        <App />
      </LoadableProvider>
    </React.StrictMode>,
    options,
  );

  // return some body items here.
}
