import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from './app';

export default () => {
  hydrateRoot(document.getElementById('app'), <App />);
};
