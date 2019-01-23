import React from 'react';
import { hydrate } from 'react-dom';
import { loadableReady } from '@loadable/component';

import App from './app';

loadableReady(() => {
  hydrate(<App />, document.getElementById('app'));
});
