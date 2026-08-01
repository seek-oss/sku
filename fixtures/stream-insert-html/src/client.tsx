import { ApolloLink, Observable } from '@apollo/client';
import { ApolloClient, InMemoryCache } from '@apollo/client-react-streaming';
import { print } from 'graphql';
import { defineClientEntry } from 'sku/ssr';

import type { resolveGraphql } from './graphql.js';
import type server from './server.js';

/** Client graph: hit the fixture GraphQL endpoint over HTTP. */
const makeClient = () =>
  new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          let cancelled = false;
          // eslint-disable-next-line no-void
          void (async () => {
            try {
              const url = new URL('/api/graphql', window.location.origin);
              url.searchParams.set(
                'operationName',
                operation.operationName ?? '',
              );
              url.searchParams.set('query', print(operation.query));
              const response = await fetch(url);
              const result = (await response.json()) as ReturnType<
                typeof resolveGraphql
              >;
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
          })();

          return () => {
            cancelled = true;
          };
        }),
    ),
  });

const client = defineClientEntry<typeof server>()({
  getReactContext() {
    return { makeClient };
  },
});

export default client;
