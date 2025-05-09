import { VocabProvider } from '@vocab/react';
import { hydrateRoot } from 'react-dom/client';
import { loadableReady } from 'sku/@loadable/component';

import App from './App';

loadableReady(() => {
  const pathLanguage = window.location.pathname.includes('fr') ? 'fr' : 'en';
  const urlParameters = new URLSearchParams(window.location.search);
  const isPseudo = Boolean(urlParameters.get('pseudo'));
  const language = isPseudo ? 'en-PSEUDO' : pathLanguage;

  hydrateRoot(
    document.getElementById('app')!,
    <VocabProvider language={language}>
      <App />
    </VocabProvider>,
  );
});
