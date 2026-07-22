import '@vitejs/plugin-react/preamble';

// Start-only: page-load + HMR telemetry clients (static uses transformIndexHtml).
import '../plugins/telemetryClients.js';

// Start-only: clear the Document-injected SSR-CSS link after HMR so
// client CSS takes over.
if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    document
      .querySelectorAll('[data-ssr-css]')
      .forEach((node) => node.remove());
  });
}

// Dev-only entry: tsdown/rolldown reorders static imports in the published
// production client entry, which can run consumer JSX before this preamble and
// break React Refresh. Load hydrate work only after the preamble evaluates.
import('./vite-ssr-client.js');
