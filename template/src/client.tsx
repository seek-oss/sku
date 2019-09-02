import React from 'react';
import { hydrate } from 'react-dom';
import { ClientContext } from './types';
import App from './App/App';

export default ({ site }: ClientContext) => {
  hydrate(<App site={site} />, document.getElementById('app'));
};
