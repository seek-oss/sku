import React from 'react';
import { hydrate } from 'react-dom';

import App from './App/App';
import { ClientContext } from './types';

export default ({ site }: ClientContext) => {
  hydrate(<App site={site} />, document.getElementById('app'));
};
