import { RouterContextProvider } from 'react-router';
import type {
  SkuSsrMiddleware,
  SkuSsrOnRequest,
  SkuSsrProviders,
  SkuSsrServerGetContext,
} from 'sku';

import { resolveLanguageFromPathname } from './resolveLanguage.js';
import { resolveSiteFromRequest } from './resolveSite.js';
import type { ClientContext } from './types.js';
import { SkuUserIdReactContext, userIdContext } from './userIdContext.js';

export const onRequest: SkuSsrOnRequest = ({ req }) => {
  const site = resolveSiteFromRequest(req);
  const language = resolveLanguageFromPathname(req.path);

  const clientContext: ClientContext = {
    fromServer: true,
    userId: req.skuUserId ?? null,
  };

  return {
    site,
    language,
    clientContext,
  };
};

/**
 * Rendered outside the router, so request state arrives as props rather than
 * from React Router hooks or a server-only Async Local Storage helper.
 */
export const Providers: SkuSsrProviders<ClientContext> = ({
  children,
  clientContext,
}) => (
  <SkuUserIdReactContext.Provider value={clientContext?.userId ?? null}>
    {children}
  </SkuUserIdReactContext.Provider>
);

export const getContext: SkuSsrServerGetContext = ({ req }) => {
  const ctx = new RouterContextProvider();
  // Project isomorphic values — never put Express `req` in RouterContextProvider.
  ctx.set(userIdContext, req.skuUserId ?? null);
  return ctx;
};

export const middleware: SkuSsrMiddleware = [
  // Attach isomorphic-capable state for onRequest / getContext (not raw `req`).
  (req, _res, next) => {
    req.skuUserId = 'fixture-user';
    next();
  },
  // Yield so the request body can finish arriving before HTML render.
  // Regression: must not treat IncomingMessage.complete as "body consumed".
  async (_req, _res, next) => {
    await new Promise<void>((resolve) => setImmediate(resolve));
    next();
  },
  (req, res, next) => {
    if (req.path === '/api/health') {
      res.status(200).type('text/plain').send('ok');
      return;
    }
    if (req.path === '/api/nonce') {
      res
        .status(200)
        .type('text/plain')
        .send(req.getCspNonce?.() ?? '');
      return;
    }
    if (req.path === '/api/user') {
      res
        .status(200)
        .type('text/plain')
        .send(req.skuUserId ?? '');
      return;
    }
    next();
  },
];
