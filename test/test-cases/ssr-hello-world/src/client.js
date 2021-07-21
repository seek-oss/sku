import { hydrate } from 'react-dom';
import { loadableReady } from '../../../../@loadable/component';

import App from './App';

loadableReady(() => {
  hydrate(<App />, document.getElementById('app'));
});
