import React from 'react';
import { hydrate } from 'react-dom';

import App from './App';

export default ({ site }) =>
  hydrate(<App themeName={site} />, document.getElementById('app'));
