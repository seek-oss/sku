import React from 'react';
import { hydrate } from 'react-dom';
import { VocabProvider } from '@vocab/react';
import { loadableReady } from 'sku/@loadable/component';

import App from './App';

loadableReady(() => {
  const pathLanguage = window.location.pathname.includes('fr') ? 'fr' : 'en';
  const urlParameters = new URLSearchParams(window.location.search);
  const isPseudo = Boolean(urlParameters.get('pseudo'));
  const language = isPseudo ? 'en-PSEUDO' : pathLanguage;

  hydrate(
    <VocabProvider language={language}>
      <App />
    </VocabProvider>,
    document.getElementById('app'),
  );
});
