import { StrictMode } from 'react';
import { makeServer, startServer } from 'sku/vite/ssr';

import { Root } from './App';

const server = makeServer({
  serverHandler: async ({ headTags, bodyTags }) => {
    const app = (
      <StrictMode>
        <Root headTags={headTags} bodyTags={bodyTags} />
      </StrictMode>
    );

    return { app };
  },
});

startServer(server);

export default server;
