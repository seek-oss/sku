import { createServer } from 'node:http';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import type { SkuContext } from '../../../context/createSkuContext.js';
import { createDevSsrServer } from './createDevSsrServer.js';

vi.mock('vite', () => ({
  createServer: async () => ({
    middlewares: (_req: unknown, _res: unknown, next: () => void) => next(),
    ssrLoadModule: async () => ({}),
  }),
}));

vi.mock('../helpers/config/createConfig.js', () => ({
  createConfig: () => ({}),
}));

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
