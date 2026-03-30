import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { renderAssets } from '@ssrx/react';
import { assetsForRequest } from '@ssrx/vite/runtime';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';

type Tags = Array<React.JSX.Element | null>;
type ServerHandler = (params: {
  headTags: Tags;
  bodyTags: Tags;
}) => Promise<{ app: ReactNode }>;

export const makeServer = ({
  serverHandler,
}: {
  serverHandler: ServerHandler;
}) => {
  const server = new Hono();

  if (import.meta.env.PROD) {
    /**
     * These two serveStatic's will be used to serve production assets.
     * Vite dev server handles assets during development.
     */
    // server
    //   .use('/assets/*', compress(), serveStatic({ root: './dist/public' }))
    //   .use('/favicon.ico', serveStatic({ path: './dist/public/favicon.ico' }));
  }

  server.get('*', async (c) => {
    try {
      const assets = await assetsForRequest(c.req.url);
      const headTags = renderAssets(assets.headAssets);
      const bodyTags = renderAssets(assets.bodyAssets);

      const { app } = await serverHandler({ headTags, bodyTags });

      const html = renderToString(app);

      // return c.html(html);
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    } catch (err: any) {
      /**
       * In development, pass the error back to the vite dev server to display in the
       * vite error overlay
       */
      if (import.meta.env.DEV) {
        return err;
      }

      throw err;
    }
  });

  return server;
};

/**
 * In development, vite handles starting up the server
 * In production, we need to start the server ourselves
 */
export const startServer = (server: Hono) => {
  if (import.meta.env.PROD) {
    const port = Number(process.env.PORT || 3000);
    serve(
      {
        port,
        fetch: server.fetch,
      },
      () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
      },
    );
  }
};
