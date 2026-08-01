import { defineClientEntry } from 'sku/ssr';

import type server from './server';

/** Optional hydrate-time side effects (e.g. analytics). Receives `{ clientContext }`. */
const client = defineClientEntry<typeof server>()({
  onHydrate() {},
});

export default client;
