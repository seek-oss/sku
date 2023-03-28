import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from './App/App';
import { ClientContext } from './types';

export default ({ environment }: ClientContext) => {
  hydrateRoot(document.getElementById('app')!, <App environment={environment} />);
};
