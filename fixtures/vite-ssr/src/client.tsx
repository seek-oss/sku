import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import type { SkuSsrOnHydrate } from 'sku';
import type { ClientContext } from './types.js';

export const onHydrate: SkuSsrOnHydrate = ({ context, language }) => {
  const clientContext = context as ClientContext;

  // We don't currently do anything with the context in this fixture, so just confirm it exists
  if (!clientContext.fromServer) {
    throw new Error('Missing client context');
  }

  return {
    AppWrapper: ({ children }: { children: ReactNode }) => (
      <VocabProvider language={language ?? 'en'}>{children}</VocabProvider>
    ),
  };
};
