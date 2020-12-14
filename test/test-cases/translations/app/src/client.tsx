import React from 'react';
import { hydrate } from 'react-dom';
import { TranslationsProvider } from '@vocab/react';

import type { RenderContext } from './types';
import App from './App';

export default ({ language }: RenderContext) => {
  hydrate(
    <TranslationsProvider language={language}>
      <App />
    </TranslationsProvider>,
    document.getElementById('app'),
  );
};
