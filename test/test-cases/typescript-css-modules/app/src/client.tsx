import React from 'react';
import { hydrate } from 'react-dom';
import { loadableReady } from '@loadable/component';

import App from 'src/App';

loadableReady(() => {
  hydrate(<App />, document.getElementById('app'));
});
