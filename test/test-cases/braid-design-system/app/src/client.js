import React from 'react';
import { hydrate } from 'react-dom';

import App from './App';

export default ({ site }) =>
  hydrate(<App theme={site} />, document.getElementById('app'));
