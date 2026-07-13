import type { Request, RequestHandler } from 'express';
import {
  createSsrRequestContextStore,
  type SsrRequestContextStore,
} from './requestContext.js';

const stores = new WeakMap<Request, SsrRequestContextStore>();

/**
 * Lazily attaches request-scoped Vite SSR context before consumer middleware:
 * - `req.getCspNonce()` (mint-on-read)
 * - `req.skuLanguage` (configured language name for vocab chunk registration)
 */
export const createSsrRequestContextMiddleware =
  (): RequestHandler => (req, _res, next) => {
    const store = createSsrRequestContextStore();
    stores.set(req, store);
    req.getCspNonce = () => store.getCspNonce();
    Object.defineProperty(req, 'skuLanguage', {
      get: () => store.getLanguage(),
      set: (value: string | undefined) => {
        store.setLanguage(value);
      },
      enumerable: true,
      configurable: true,
    });
    next();
  };

export const getRequestContextStore = (
  req: Request,
): SsrRequestContextStore | undefined => stores.get(req);

/** @deprecated Use `getRequestContextStore`. */
export const getRequestCspNonceStore = getRequestContextStore;
