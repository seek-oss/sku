import {
  getCspNonce,
  type SkuSsrMiddleware,
  type SkuSsrOnRequest,
  type SkuSsrProviders,
} from 'sku';

import { ApolloProvider, makeClient } from './ApolloProvider.js';
import { resolveGraphql } from './graphql.js';

export const onRequest: SkuSsrOnRequest = () => ({
  site: 'default',
});

/**
 * Server entry only: pass the CSP nonce onto injected transport scripts.
 * Client `Providers` omit `extraScriptProps`.
 */
export const Providers: SkuSsrProviders = ({ children }) => (
  <ApolloProvider
    makeClient={makeClient}
    extraScriptProps={{ nonce: getCspNonce() }}
  >
    {children}
  </ApolloProvider>
);

export const middleware: SkuSsrMiddleware = [
  (req, res, next) => {
    // GET keeps the fixture free of body-parser wiring; HttpLink uses GET for queries.
    if (req.path === '/api/graphql' && req.method === 'GET') {
      const result = resolveGraphql({
        operationName:
          typeof req.query.operationName === 'string'
            ? req.query.operationName
            : null,
        query: typeof req.query.query === 'string' ? req.query.query : '',
      });
      res.status(200).type('application/json').send(result);
      return;
    }
    next();
  },
];
