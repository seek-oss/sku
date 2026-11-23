import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import express, { type Express, type RequestHandler } from 'express';
import { createServer, type Server } from 'node:http';

import type { SkuContext } from '../../../context/createSkuContext.js';
import {
  createDevSsrServer,
  mountStartSsrMiddleware,
} from './createDevSsrServer.js';

vi.mock('vite', () => ({
  createServer: async () => ({
    middlewares: (_req: unknown, _res: unknown, next: () => void) => next(),
    ssrLoadModule: async () => ({}),
  }),
}));

vi.mock('../helpers/config/createConfig.js', () => ({
  createConfig: () => ({}),
}));

describe('mountStartSsrMiddleware', () => {
  const servers: Server[] = [];

  afterEach(async () => {
    for (const httpServer of servers.splice(0)) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  const listen = async (app: Express) => {
    const httpServer = await new Promise<Server>((resolve) => {
      const server = app.listen(0, '127.0.0.1', () => resolve(server));
    });
    servers.push(httpServer);
    const { port } = httpServer.address() as { port: number };
    return `http://127.0.0.1:${port}`;
  };

  const viteMiddlewares: RequestHandler = (req, res, next) => {
    if (req.url === '/@vite/client') {
      res.status(200).type('text/javascript').send('/* vite client */');
      return;
    }
    next();
  };

  it('serves Vite asset URLs before catch-all server-entry middleware', async () => {
    const app = express();
    mountStartSsrMiddleware({
      app,
      viteMiddlewares,
      consumerMiddleware: [
        (_req, res) => {
          res.status(418).type('text/plain').send('middleware-handled');
        },
      ],
      htmlMiddleware: (_req, res) => {
        res.status(200).type('text/html').send('<!DOCTYPE html>');
      },
    });

    const origin = await listen(app);
    const viteClient = await fetch(`${origin}/@vite/client`);
    expect(viteClient.status).toBe(200);
    expect(viteClient.headers.get('content-type')).toMatch(/javascript/);
    expect(await viteClient.text()).toBe('/* vite client */');
  });

  it('still runs consumer middleware and HTML for document paths', async () => {
    const app = express();
    mountStartSsrMiddleware({
      app,
      viteMiddlewares,
      consumerMiddleware: [
        (req, res, next) => {
          res.setHeader('x-consumer-middleware', '1');
          if (req.path === '/api/health') {
            res.status(200).type('text/plain').send('ok');
            return;
          }
          next();
        },
      ],
      htmlMiddleware: (_req, res) => {
        res.status(200).type('text/html').send('<!DOCTYPE html>home');
      },
    });

    const origin = await listen(app);
    const health = await fetch(`${origin}/api/health`);
    expect(await health.text()).toBe('ok');
    expect(health.headers.get('x-consumer-middleware')).toBe('1');

    const document = await fetch(`${origin}/`);
    expect(await document.text()).toBe('<!DOCTYPE html>home');
    expect(document.headers.get('x-consumer-middleware')).toBe('1');
  });

  it('runs devServerMiddleware after Vite and before server-entry middleware', async () => {
    const app = express();
    mountStartSsrMiddleware({
      app,
      viteMiddlewares,
      loadDevServerMiddleware: (serverApp) => {
        serverApp.get('/mock-api', (_req, res) => {
          res.status(200).type('text/plain').send('dev-mock');
        });
      },
      consumerMiddleware: [
        (_req, res) => {
          res.status(418).type('text/plain').send('middleware-handled');
        },
      ],
      htmlMiddleware: (_req, res) => {
        res.status(200).type('text/html').send('<!DOCTYPE html>');
      },
    });

    const origin = await listen(app);

    const viteClient = await fetch(`${origin}/@vite/client`);
    expect(await viteClient.text()).toBe('/* vite client */');

    const mock = await fetch(`${origin}/mock-api`);
    expect(mock.status).toBe(200);
    expect(await mock.text()).toBe('dev-mock');

    const other = await fetch(`${origin}/not-handled`);
    expect(other.status).toBe(418);
    expect(await other.text()).toBe('middleware-handled');
  });
});

describe('createDevSsrServer', () => {
  it('leaves keep-alive at the Node default and does not register SIGTERM', async () => {
    const defaultKeepAliveTimeout = createServer().keepAliveTimeout;
    const sigtermListeners = process.listenerCount('SIGTERM');

    const { httpServer } = await createDevSsrServer({
      environment: 'development',
      skuContext: {
        sites: [],
        hosts: [],
        paths: {},
        port: { client: 0 },
      } as unknown as SkuContext,
    });
    onTestFinished(() => {
      httpServer.close();
    });

    expect(httpServer.keepAliveTimeout).toBe(defaultKeepAliveTimeout);
    expect(process.listenerCount('SIGTERM')).toBe(sigtermListeners);
  });
});
