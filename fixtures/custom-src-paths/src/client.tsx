import { hydrateRoot } from 'react-dom/client';

/** @knipignore Can't seem to ignore this via knip config */
import App from 'another-folder/App';

export default () => {
  hydrateRoot(document.getElementById('app')!, <App />);
};
