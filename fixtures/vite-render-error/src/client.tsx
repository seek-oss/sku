import { hydrateRoot } from 'react-dom/client';

import { App } from './App';

type ClientContext = {
  route: string;
};

export default ({ route }: ClientContext) => {
  hydrateRoot(document.getElementById('app')!, <App route={route} />);
};
