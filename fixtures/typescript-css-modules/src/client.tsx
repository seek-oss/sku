import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from 'src/App';

export default () => {
  hydrateRoot(document.getElementById('app')!, <App />);
};
