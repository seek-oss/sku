import { defineClientEntry } from 'sku/ssr';

import type server from './server.js';

const client = defineClientEntry<typeof server>()({});

export default client;
