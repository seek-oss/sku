import { RouterContextProvider } from 'react-router';
import { defineServerEntry } from 'sku/runtime';

import { configMiddleware, getLanguage, getSite } from './config.js';
import { userIdContext } from './userIdContext.js';

const server = defineServerEntry({
  onListen({ port }) {
    // eslint-disable-next-line no-console
    console.log('Server is listening on port', port);
  },
  getSite,
  getLanguage,
  getClientContext({ req }) {
    return {
      fromServer: true as const,
      userId: req.skuUserId ?? null,
    };
  },
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
  middleware: [
    configMiddleware,
    (req, _res, next) => {
      req.skuUserId = 'fixture-user';
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
  ],
});

export default server;
