import { ApolloLink, Observable } from '@apollo/client';
import { ApolloClient, InMemoryCache } from '@apollo/client-react-streaming';
import { getCspNonce } from 'sku';
import { defineServerEntry } from 'sku/ssr';

import { resolveGraphql } from './graphql.js';

/** Server graph: resolve fixture operations in-process (no HTTP hop). */
const makeClient = () =>
  new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          let cancelled = false;
          // Small delay so the stream can interleave transport scripts.
          const timer = setTimeout(() => {
            try {
              const result = resolveGraphql({
                operationName: operation.operationName,
              });
              if (!cancelled) {
                // Fixture resolver returns a simplified shape.
                observer.next(result as Parameters<typeof observer.next>[0]);
                observer.complete();
              }
            } catch (error) {
              if (!cancelled) {
                observer.error(error);
              }
            }
          }, 20);

          return () => {
            cancelled = true;
            clearTimeout(timer);
          };
        }),
    ),
  });

const server = defineServerEntry({
  getReactContext() {
    return {
      makeClient,
      // Server only: pass the CSP nonce onto injected transport scripts.
      extraScriptProps: { nonce: getCspNonce() },
    };
  },
  middleware: [
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
  ],
});

export default server;
