import type { SkuSsrServerEntry } from 'sku';

import { createAppWrapper, type ClientContext } from './AppProviders.js';

const resolveLanguage = (request: Request): 'en' | 'fr' => {
  const { pathname } = new URL(request.url);
  if (pathname === '/fr' || pathname.startsWith('/fr/')) {
    return 'fr';
  }

  return 'en';
};

const onRequest: SkuSsrServerEntry = ({ request }) => {
  const language = resolveLanguage(request);

  const clientContext: ClientContext = {
    fromServer: true,
  };

  return {
    language,
    clientContext,
    AppWrapper: createAppWrapper({
      language,
    }),
  };
};

export default onRequest;
