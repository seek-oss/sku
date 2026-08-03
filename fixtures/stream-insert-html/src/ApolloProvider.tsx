import { WrapApolloProvider } from '@apollo/client-react-streaming';
import { buildManualDataTransport } from '@apollo/client-react-streaming/manual-transport';
import { useInsertHtml } from 'sku/runtime';

// eslint-disable-next-line new-cap
export const ApolloProvider = WrapApolloProvider(
  buildManualDataTransport({ useInsertHtml }),
);
