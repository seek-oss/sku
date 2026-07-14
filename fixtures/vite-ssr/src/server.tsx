import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { resolveLanguageFromPathname } from './resolveLanguage.js';
import type { ClientContext } from './types.js';

export const onRequest: SkuSsrOnRequest = ({ request }) => {
  const language = resolveLanguageFromPathname(new URL(request.url).pathname);

  const clientContext: ClientContext = {
    fromServer: true,
  };

  return {
    language,
    clientContext,
    AppWrapper: ({ children }: { children: ReactNode }) => {
      const { pathname } = useLocation();
      return (
        <VocabProvider language={resolveLanguageFromPathname(pathname)}>
          {children}
        </VocabProvider>
      );
    },
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
