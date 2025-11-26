import { hydrateRoot } from 'react-dom/client';

import App from './App';

// Set to true to demonstrate attempting load unsafe script execution
const ATTEMPT_LOAD_UNSAFE_SCRIPT = false;

export default ({ dynamicScriptNonce }) => {
  const safeScript = document.createElement('script');
  safeScript.setAttribute('nonce', dynamicScriptNonce);
  safeScript.textContent =
    'console.log("Hello from dynamically created script")';
  document.body.appendChild(safeScript);

  if (ATTEMPT_LOAD_UNSAFE_SCRIPT) {
    const evilScript = document.createElement('script');
    evilScript.textContent =
      'throw new Error("Evil Code Executed! Muahahaha! 🧛‍♂️")';
    document.body.appendChild(evilScript);
  }

  hydrateRoot(document.getElementById('app'), <App />);
};
