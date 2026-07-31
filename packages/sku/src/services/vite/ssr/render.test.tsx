import { readFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { createContext, useContext } from 'react';
import type { Request as ExpressRequest } from 'express';
import { describe, expect, it } from 'vitest';

import { buildSiteStaticHandlers } from './buildSiteStaticHandlers.js';
import { render } from './render.js';
import type { RenderAssets, SkuSsrProviders } from './types.js';

const SiteContext = createContext<string | null>(null);
const UserContext = createContext<string | null>(null);

const Page = () => (
  <main>
    <p data-testid="site">{useContext(SiteContext) ?? 'no site'}</p>
    <p data-testid="user">{useContext(UserContext) ?? 'no user'}</p>
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

const onRequest = () => ({
  site: 'au',
  clientContext: { userId: 'user-1' },
});

const renderToHtml = async (Providers?: SkuSsrProviders) => {
  const result = await render({
    siteStaticHandlers,
    request: new Request('http://localhost/'),
    req: { path: '/' } as ExpressRequest,
    assets,
    onRequest,
    Providers,
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
  it('renders Providers outside the router with site and clientContext', async () => {
    const Providers: SkuSsrProviders<{ userId: string }> = ({
      children,
      site,
      clientContext,
    }) => (
      <SiteContext.Provider value={site}>
        <UserContext.Provider value={clientContext?.userId ?? null}>
          {children}
        </UserContext.Provider>
      </SiteContext.Provider>
    );

    const html = await renderToHtml(Providers as SkuSsrProviders);

    expect(html).toContain('>au<');
    expect(html).toContain('>user-1<');
  });

  it('renders the router directly when Providers is omitted', async () => {
    const html = await renderToHtml();

    expect(html).toContain('>no site<');
    expect(html).toContain('>no user<');
  });

  it('never creates a static handler on the request path', async () => {
    const source = await readFile(
      new URL('./render.tsx', import.meta.url),
      'utf-8',
    );

    expect(source).not.toContain('createStaticHandler');
  });
});
