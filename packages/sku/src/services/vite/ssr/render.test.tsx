import { readFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import type { Request as ExpressRequest } from 'express';
import { RouterContextProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { buildSiteStaticHandlers } from './buildSiteStaticHandlers.js';
import { createSkuContexts } from './skuContext.js';
import { render } from './render.js';
import type { RenderAssets } from './types.js';

const { useSite, useClientContext, useReactContext } = createSkuContexts<
  {
    getClientContext: () => { userId: string };
    getReactContext: () => { api: string };
  },
  {
    getReactContext: () => { api: string };
  }
>();

const Page = () => (
  <main>
    <p data-testid="site">{useSite()}</p>
    <p data-testid="user">{useClientContext()?.userId ?? 'no user'}</p>
    <p data-testid="api">{useReactContext()?.api ?? 'no api'}</p>
  </main>
);

const siteStaticHandlers = buildSiteStaticHandlers({
  au: [{ path: '/', Component: Page }],
});

const assets: RenderAssets = {
  css: [],
  modulePreloads: [],
  bootstrapModules: [],
};

const getSite = () => 'au';
const getClientContext = () => ({ userId: 'user-1' });
const getReactContext = () => ({ api: 'server-api' });

const renderToHtml = async ({
  includeClientContext = true,
  includeReactContext = true,
}: {
  includeClientContext?: boolean;
  includeReactContext?: boolean;
} = {}) => {
  const result = await render({
    siteStaticHandlers,
    request: new Request('http://localhost/'),
    req: { path: '/' } as ExpressRequest,
    assets,
    getSite,
    getClientContext: includeClientContext ? getClientContext : undefined,
    getReactContext: includeReactContext ? getReactContext : undefined,
  });

  if ('response' in result) {
    throw new Error('Expected a streamed document, not a Response');
  }

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
      final(callback) {
        callback();
        resolve();
      },
    });
    writable.on('error', reject);
    result.pipe(writable);
  });

  return Buffer.concat(chunks).toString('utf-8');
};

describe('render', () => {
  it('always mounts SkuProvider with site, clientContext, and reactContext', async () => {
    const html = await renderToHtml();

    expect(html).toContain('>au<');
    expect(html).toContain('>user-1<');
    expect(html).toContain('>server-api<');
  });

  it('passes undefined clientContext / reactContext when getters are omitted', async () => {
    const html = await renderToHtml({
      includeClientContext: false,
      includeReactContext: false,
    });

    expect(html).toContain('>au<');
    expect(html).toContain('>no user<');
    expect(html).toContain('>no api<');
    expect(html).toContain('window.__SKU_CLIENT_CONTEXT__=undefined');
    expect(html).not.toContain('window.__SKU_CLIENT_CONTEXT__=null');
  });

  it('projects sibling values into getRouterContext before query()', async () => {
    let seen: {
      site?: string;
      clientContext?: { userId: string };
      reactContext?: { api: string };
    } = {};

    await render({
      siteStaticHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      getClientContext,
      getReactContext,
      getRouterContext: ({ site, clientContext, reactContext }) => {
        seen = {
          site,
          clientContext: clientContext as { userId: string } | undefined,
          reactContext: reactContext as { api: string } | undefined,
        };
        return new RouterContextProvider();
      },
    });

    expect(seen).toEqual({
      site: 'au',
      clientContext: { userId: 'user-1' },
      reactContext: { api: 'server-api' },
    });
  });

  it('never creates a static handler on the request path', async () => {
    const source = await readFile(
      new URL('./render.tsx', import.meta.url),
      'utf-8',
    );

    expect(source).not.toContain('createStaticHandler');
    expect(source).toContain('SkuProvider');
  });

  it('uses the sole config site when getSite is omitted', async () => {
    const result = await render({
      siteStaticHandlers,
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      // no getSite — sole key in siteStaticHandlers
    });

    if ('response' in result) {
      throw new Error('Expected a streamed document, not a Response');
    }

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
        final(callback) {
          callback();
          resolve();
        },
      });
      writable.on('error', reject);
      result.pipe(writable);
    });

    const html = Buffer.concat(chunks).toString('utf-8');
    expect(html).toContain('__SKU_SITE__');
    expect(html).toContain('"au"');
  });

  it('fails closed when getSite returns an unknown site', async () => {
    await expect(
      render({
        siteStaticHandlers,
        request: new Request('http://localhost/'),
        req: { path: '/' } as ExpressRequest,
        assets,
        getSite: () => 'uk',
      }),
    ).rejects.toThrow(
      /SSR has no pre-built route tree for site 'uk'\. Unknown or invalid 'site'\./,
    );
  });
});
