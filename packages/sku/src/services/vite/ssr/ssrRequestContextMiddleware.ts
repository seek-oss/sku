import type { Request, RequestHandler } from 'express';
import { createSsrRequestContextStore } from './createSsrRequestContextStore.js';
import type { SsrRequestContextStore } from './requestContext.js';

const stores = new WeakMap<Request, SsrRequestContextStore>();

/**
 * Lazily attaches request-scoped Vite SSR context before consumer middleware:
 * - `req.getCspNonce()` (mint-on-read)
 *
 * Language identity is set by the server request entry, not Express.
 */
export const createSsrRequestContextMiddleware =
  (): RequestHandler => (req, _res, next) => {
    const store = createSsrRequestContextStore();
    stores.set(req, store);
    req.getCspNonce = () => store.getCspNonce();
    next();
  };

export const getRequestContextStore = (
  req: Request,
): SsrRequestContextStore | undefined => stores.get(req);

/** @deprecated Use `getRequestContextStore`. */
export const getRequestCspNonceStore = getRequestContextStore;
