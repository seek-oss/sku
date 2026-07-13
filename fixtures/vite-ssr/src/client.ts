import type { SkuSsrClientEntry } from 'sku';

import { createAppWrapper, type ClientContext } from './AppProviders.js';

const onHydrate: SkuSsrClientEntry = ({ context, language }) => {
  const clientContext = context as ClientContext;

  // We don't currently don't anything with the context in this fixture, so just confirm it exists
  if (!clientContext.fromServer) {
    throw new Error('Missing client context');
  }

  return {
    AppWrapper: createAppWrapper({
      language: language ?? 'en',
    }),
  };
};

export default onHydrate;
