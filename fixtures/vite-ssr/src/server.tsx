import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';
import type { ClientContext } from './types.js';

const resolveLanguage = (request: Request): 'en' | 'fr' => {
  const { pathname } = new URL(request.url);
  if (pathname === '/fr' || pathname.startsWith('/fr/')) {
    return 'fr';
  }

  return 'en';
};

export const onRequest: SkuSsrOnRequest = ({ request }) => {
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

export const middleware: SkuSsrMiddleware = (req, res, next) => {
  if (req.path === '/api/health') {
    res.status(200).type('text/plain').send('ok');
    return;
  }
  if (req.path === '/api/nonce') {
    res
      .status(200)
      .type('text/plain')
      .send(req.getCspNonce?.() ?? '');
    return;
  }
  next();
};
