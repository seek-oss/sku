import { describe, expect, it, vi } from 'vitest';
import type * as ReactRouter from 'react-router';
import type * as ReactDomClient from 'react-dom/client';

const matchRoutes = vi.hoisted(() => vi.fn(() => undefined));
const createBrowserRouter = vi.hoisted(() => vi.fn(() => ({ id: 'router' })));
const hydrateRoot = vi.hoisted(() => vi.fn());

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>();
  return {
    ...actual,
    matchRoutes,
    createBrowserRouter,
  };
});

vi.mock('react-dom/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactDomClient>();
  return {
    ...actual,
    hydrateRoot,
  };
});

const { hydrateClient } = await import('./hydrateClient.js');

const hydrateArgs = {
  site: 'au',
  clientContext: { userId: 'user-1' },
  siteRoutes: [{ path: '/' }],
  documentAssets: { css: [], modulePreloads: [] },
};

describe('hydrateClient', () => {
  it('awaits Promise getReactContext before createBrowserRouter and hydrateRoot', async () => {
    vi.stubGlobal('document', {});
    vi.stubGlobal('window', { location: '/' });
    createBrowserRouter.mockClear();
    hydrateRoot.mockClear();

    let release!: (value: { api: string }) => void;
    const pending = hydrateClient({
      ...hydrateArgs,
      getReactContext: () =>
        new Promise<{ api: string }>((resolve) => {
          release = resolve;
        }),
    });

    await Promise.resolve();
    expect(createBrowserRouter).not.toHaveBeenCalled();
    expect(hydrateRoot).not.toHaveBeenCalled();

    release({ api: 'client-api' });
    await pending;

    expect(createBrowserRouter).toHaveBeenCalledOnce();
    expect(hydrateRoot).toHaveBeenCalledOnce();
  });

  it('fails hydrate when getReactContext rejects', async () => {
    vi.stubGlobal('document', {});
    createBrowserRouter.mockClear();
    hydrateRoot.mockClear();

    const error = new Error('reactContext failed');
    await expect(
      hydrateClient({
        ...hydrateArgs,
        getReactContext: () => Promise.reject(error),
      }),
    ).rejects.toBe(error);

    expect(createBrowserRouter).not.toHaveBeenCalled();
    expect(hydrateRoot).not.toHaveBeenCalled();
  });
});
