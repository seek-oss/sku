import { hydrate } from 'react-dom';

import App from 'src/App';

export default () => {
  hydrate(<App />, document.getElementById('app'));
};
