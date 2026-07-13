import { AsyncLocalStorage } from 'node:async_hooks';
import {
  installSsrRequestContextStorage,
  type SsrRequestContextStore,
} from './requestContext.js';

/**
 * Side-effect import from Vite SSR server entry points. Installs Node
 * AsyncLocalStorage into the shared requestContext module without pulling
 * `node:async_hooks` into the client bundle.
 */
installSsrRequestContextStorage(
  new AsyncLocalStorage<SsrRequestContextStore>(),
);
