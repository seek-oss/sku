import React from 'react';
import { hydrate } from 'react-dom';
import { RenderContext } from './types';
import App from './App/App';

export default ({ site }: RenderContext) => {
  hydrate(<App site={site} />, document.getElementById('app'));
};
