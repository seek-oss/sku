import React from 'react';
import { hydrate } from 'react-dom';
import { VocabProvider } from '@vocab/react';
import { loadableReady } from '../../../../../@loadable/component';

import App from './App';

loadableReady(() => {
  const language = window.location.pathname.includes('fr') ? 'fr' : 'en';

  hydrate(
    <VocabProvider language={language}>
      <App />
    </VocabProvider>,
    document.getElementById('app'),
  );
});
