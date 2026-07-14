import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import type { SkuSsrServerEntry } from 'sku';
import type { ClientContext } from './types';

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
    AppWrapper: ({ children }: { children: ReactNode }) => (
      <VocabProvider language={language}>{children}</VocabProvider>
    ),
  };
};

export default onRequest;
