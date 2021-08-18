import React from 'react';
import { hydrate } from 'react-dom';

import App from './App/App';
import { ClientContext } from './types';

export default ({ environment }: ClientContext) => {
  hydrate(<App environment={environment} />, document.getElementById('app'));
};
