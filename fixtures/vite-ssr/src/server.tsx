import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { RouterContextProvider, useLocation } from 'react-router';
import type {
  SkuSsrMiddleware,
  SkuSsrOnRequest,
  SkuSsrServerGetContext,
} from 'sku';

import { resolveLanguageFromPathname } from './resolveLanguage.js';
import { createRoutes } from './routes.js';
import type { ClientContext } from './types.js';
import { SkuUserIdReactContext, userIdContext } from './userIdContext.js';

export const routes = createRoutes();

export const onRequest: SkuSsrOnRequest = ({ req }) => {
  const language = resolveLanguageFromPathname(req.path);
  const userId = req.skuUserId ?? null;

  const clientContext: ClientContext = {
    fromServer: true,
    userId,
  };

  return {
    language,
    clientContext,
    AppWrapper: ({ children }: { children: ReactNode }) => {
      const { pathname } = useLocation();
      return (
        <SkuUserIdReactContext.Provider value={userId}>
          <VocabProvider language={resolveLanguageFromPathname(pathname)}>
            {children}
          </VocabProvider>
        </SkuUserIdReactContext.Provider>
      );
    },
  };
};

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
