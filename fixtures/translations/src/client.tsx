import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { VocabProvider } from '@vocab/react';

import type { RenderContext } from './types';
import App from './App';

export default ({ language: skuLanguage }: RenderContext) => {
  const Client = () => {
    const urlParameters = new URLSearchParams(window.location.search);
    const isPseudo = Boolean(urlParameters.get('pseudo'));
    const language = isPseudo ? 'en-PSEUDO' : skuLanguage;

    return (
      <VocabProvider language={language}>
        <App />
      </VocabProvider>
    );
  };
  hydrateRoot(document.getElementById('app')!, <Client />);
};
