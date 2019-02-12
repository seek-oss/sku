import React from 'react';
import { hydrate } from 'react-dom';

import App from './app';

export default () => {
  console.warn('This is a warning');
  console.warn('This is another warning');
  console.error('This is an error');

  hydrate(<App />, document.getElementById('app'));
};
