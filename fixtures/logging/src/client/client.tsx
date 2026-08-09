import { defineClientEntry } from 'sku/runtime';

import type server from '../server/server.js';

import { clientInstrumentation } from './instrumentation.js';
import { startClientTracing } from './tracing.js';

startClientTracing();

const client = defineClientEntry<typeof server>()({
  instrumentations: [clientInstrumentation],
});

export default client;
