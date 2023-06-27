import { hydrateRoot } from 'react-dom/client';

import App from 'src/App';

hydrateRoot(document.getElementById('app')!, <App />);
