import { hydrateRoot } from 'react-dom/client';
import { loadableReady } from 'sku/@loadable/component';

import App from './App';

// Set to true to demonstrate attempting load unsafe script execution
const ATTEMPT_LOAD_UNSAFE_SCRIPT = false;

loadableReady(() => {
  const contextElement = document.getElementById('render-context');
  if (!contextElement) {
    throw new Error('Render context element not found');
  }
  const renderContext = JSON.parse(contextElement.textContent || '{}');

  const dynamicScriptNonce = renderContext.dynamicScriptNonce;
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
});
