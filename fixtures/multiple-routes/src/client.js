import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

export default ({ site }) => {
  hydrateRoot(
    document.getElementById('root'),
    <BrowserRouter>
      <App site={site} />
    </BrowserRouter>,
  );
};
