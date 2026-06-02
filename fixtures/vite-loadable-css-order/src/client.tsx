import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import App from './App';
import type { RouteName } from './routes';

export default ({ route }: { route: RouteName }) => {
  hydrateRoot(
    document.getElementById('app')!,
    <BrowserRouter>
      <App route={route} />
    </BrowserRouter>,
  );
};
