import React from 'react';
import { hydrate } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

export default ({ site }) => {
  hydrate(
    <BrowserRouter>
      <App site={site} />
    </BrowserRouter>,
    document.getElementById('app'),
  );
};
