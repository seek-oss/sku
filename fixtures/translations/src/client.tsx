import { VocabProvider } from '@vocab/react';
import { useEffect, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from './App';
import type { RenderContext } from './types';

export default ({ language: skuLanguage }: RenderContext) => {
  const Client = () => {
    const [language, setLanguage] = useState(skuLanguage);

    useEffect(() => {
      const isPseudo = Boolean(
        new URLSearchParams(window.location.search).get('pseudo'),
      );
      if (isPseudo) {
        setLanguage('en-PSEUDO');
      }
    }, []);

    return (
      <VocabProvider language={language}>
        <App />
      </VocabProvider>
    );
  };
  hydrateRoot(document.getElementById('app')!, <Client />);
};
