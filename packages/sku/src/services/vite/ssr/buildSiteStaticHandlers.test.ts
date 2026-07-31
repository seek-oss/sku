import { describe, expect, it, vi } from 'vitest';
import type * as ReactRouter from 'react-router';
import type { RouteObject } from 'react-router';

const createStaticHandler = vi.hoisted(() => vi.fn());

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>();
  return {
    ...actual,
    createStaticHandler: createStaticHandler.mockImplementation(
      actual.createStaticHandler,
    ),
  };
});

const { buildSiteStaticHandlers } =
  await import('./buildSiteStaticHandlers.js');

const siteRouteTrees: Record<string, RouteObject[]> = {
  au: [{ path: '/', Component: () => null }],
  nz: [{ path: '/', Component: () => null }],
};

describe('buildSiteStaticHandlers', () => {
  it('creates one handler per site, once, at init', () => {
    createStaticHandler.mockClear();
    const handlers = buildSiteStaticHandlers(siteRouteTrees);

    expect(Object.keys(handlers)).toEqual(['au', 'nz']);
    expect(createStaticHandler).toHaveBeenCalledTimes(2);
    expect(handlers.au.query).toBeTypeOf('function');
    expect(handlers.au.dataRoutes).toBeDefined();
  });

  it('reuses the same handler across requests for a site', async () => {
    const handlers = buildSiteStaticHandlers(siteRouteTrees);
    createStaticHandler.mockClear();

    await handlers.au.query(new Request('http://localhost/'));
    await handlers.au.query(new Request('http://localhost/'));

    expect(createStaticHandler).not.toHaveBeenCalled();
  });
});
