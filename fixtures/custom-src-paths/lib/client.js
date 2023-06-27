import { hydrateRoot } from 'react-dom/client';
import App from '../another-folder/App';

export default () => {
  hydrateRoot(document.getElementById('app'), <App />);
};
