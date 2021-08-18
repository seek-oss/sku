import React from 'react';
import { hydrate } from 'react-dom';
import { VocabProvider } from '@vocab/react';

import type { RenderContext } from './types';
import App from './App';

export default ({ language }: RenderContext) => {
  hydrate(
    <VocabProvider language={language}>
      <App />
    </VocabProvider>,
    document.getElementById('app'),
  );
};
