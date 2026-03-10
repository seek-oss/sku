import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { hydrateRoot } from 'react-dom/client';

import App from './App';

export default () => {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink(),
  });

  hydrateRoot(
    document.getElementById('app')!,
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>,
  );
};
