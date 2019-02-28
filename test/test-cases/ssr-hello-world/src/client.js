import React from 'react';
import { hydrate } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { loadableReady } from '../../../../@loadable/component';

import App from './App';

const render = Component => {
  hydrate(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('app'),
  );
};

loadableReady(() => {
  render(App);
});

if (module.hot) {
  module.hot.accept('./App', () => {
    render(App);
  });
}
