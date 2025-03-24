import { renderToPipeableStream } from 'react-dom/server';

import App from './App';

export default {
  render: async ({ options, site }) => {
    const appSite = typeof site === 'string' ? site : site?.name;

    const result = renderToPipeableStream(<App themeName={appSite} />, options);

    return result;
  },

  provideClientContext: async ({ site }) => ({
    site: typeof site === 'string' ? site : site?.name,
    rootElementId: 'root',
  }),
};
