import { defineClientEntry } from 'sku/runtime';

import type server from './server.js';

const client = defineClientEntry<typeof server>()({});

export default client;
