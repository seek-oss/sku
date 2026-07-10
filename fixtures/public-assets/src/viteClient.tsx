import { hydrateRoot } from 'react-dom/client';
import url from '/nested/icon.png?url';

import App from './App.tsx';

export default () => {
  hydrateRoot(document.getElementById('app')!, <App url={url} />);
};
