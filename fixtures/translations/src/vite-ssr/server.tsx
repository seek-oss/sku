import { defineServerEntry } from 'sku/runtime';

import { resolveLanguage } from './resolveLanguage.js';

// Single-site: omit `getSite` — sku uses the sole config site name.
const server = defineServerEntry({
  getLanguage({ req }) {
    const url = new URL(req.originalUrl, 'http://localhost');
    return resolveLanguage(url.pathname, url.search);
  },
});

export default server;
