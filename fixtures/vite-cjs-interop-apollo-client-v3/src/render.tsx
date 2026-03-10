import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import html from 'dedent';
import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';

import App from './App';

export default {
  renderApp: ({ SkuProvider }) => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink(),
    });

    return renderToString(
      <SkuProvider>
        <ApolloProvider client={client}>
          <App />
        </ApolloProvider>
      </SkuProvider>,
    );
  },

  renderDocument: ({ app, bodyTags, headTags }) => html /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>hello-world</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} satisfies Render;
