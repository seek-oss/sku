import {
  ApolloClient,
  InMemoryCache,
  WrapApolloProvider,
} from '@apollo/client-react-streaming';
import { buildManualDataTransport } from '@apollo/client-react-streaming/manual-transport';
import { ApolloLink, Observable } from '@apollo/client';
import { print } from 'graphql';
import { useInsertHtml } from 'sku/ssr';

import { resolveGraphql } from './graphql.js';

/**
 * App-owned transport over sku's `useInsertHtml` seam. Shared by both request
 * entries so the same provider mounts outside the router on server and client.
 */
export const ApolloProvider = WrapApolloProvider(
  buildManualDataTransport({ useInsertHtml }),
);

/**
 * One link for both graphs. Environment is checked at request time (not via
 * `import.meta.env.SSR` at `makeClient` time) so a accidentally shared module
 * instance still hits `/api/graphql` in the browser.
 */
const fixtureLink = new ApolloLink(
  (operation) =>
    new Observable((observer) => {
      let cancelled = false;
      const delayMs = typeof window === 'undefined' ? 20 : 0;
      const timer = setTimeout(() => {
        void (async () => {
          try {
            let result: ReturnType<typeof resolveGraphql>;
            if (typeof window === 'undefined') {
              result = resolveGraphql({
                operationName: operation.operationName,
              });
            } else {
              const url = new URL('/api/graphql', window.location.origin);
              url.searchParams.set(
                'operationName',
                operation.operationName ?? '',
              );
              url.searchParams.set('query', print(operation.query));
              const response = await fetch(url);
              result = (await response.json()) as ReturnType<
                typeof resolveGraphql
              >;
            }
            if (!cancelled) {
              observer.next(result);
              observer.complete();
            }
          } catch (error) {
            if (!cancelled) {
              observer.error(error);
            }
          }
        })();
      }, delayMs);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }),
);

export const makeClient = () =>
  new ApolloClient({
    cache: new InMemoryCache(),
    link: fixtureLink,
  });
