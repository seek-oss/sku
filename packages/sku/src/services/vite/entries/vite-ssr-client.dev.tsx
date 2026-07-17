import '@vitejs/plugin-react/preamble';

// Dev-only entry: tsdown/rolldown reorders static imports in the published
// production client entry, which can run consumer JSX before this preamble and
// break React Refresh. Load hydrate work only after the preamble evaluates.
import('./vite-ssr-client.js');
