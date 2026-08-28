import { defineServerEntry } from 'sku/runtime';

import { log } from '../shared/log.js';

import { routeInstrumentation } from './instrumentation.js';
import { middleware } from './middleware.js';
import { startServerTracing } from './tracing.js';

startServerTracing();

const server = defineServerEntry({
  onListen({ port }) {
    log.info('server.listen', { port });
  },
  instrumentations: [routeInstrumentation],
  middleware,
});

export default server;
