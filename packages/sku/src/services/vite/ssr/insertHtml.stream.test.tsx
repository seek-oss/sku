import { Writable } from 'node:stream';
import { Suspense, use } from 'react';
import type { Request as ExpressRequest } from 'express';
import { describe, expect, it } from 'vitest';

import { buildSiteStaticHandlers } from './buildSiteStaticHandlers.js';
import { render } from './render.js';
import { useInsertHtml } from 'sku/runtime';
import type { RenderAssets } from './types.js';

const assets: RenderAssets = {
  css: [],
  modulePreloads: [],
  bootstrapModules: ['/client.js'],
};

const getSite = () => 'au';

const renderToHtml = async ({
  routes,
}: {
  routes: Parameters<typeof buildSiteStaticHandlers>[0]['au'];
}) => {
  const result = await render({
    siteStaticHandlers: buildSiteStaticHandlers({ au: routes }),
    request: new Request('http://localhost/'),
    req: { path: '/' } as ExpressRequest,
    assets,
    getSite,
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
    result.commit(writable);
  });

  return {
    html: Buffer.concat(chunks).toString('utf-8'),
    inlineScripts: result.inlineScripts,
  };
};

const InjectingPage = ({ marker }: { marker: string }) => {
  const insertHtml = useInsertHtml();
  insertHtml(() => (
    <script data-testid="sku-injected" data-marker={marker}>
      {`window.__SKU_INJECTED__=${JSON.stringify(marker)};`}
    </script>
  ));
  return <main data-testid="page">page</main>;
};

const getDeferred = () =>
  new Promise<string>((resolve) => {
    setTimeout(() => resolve('deferred'), 20);
  });

const DeferredInjectingPage = () => {
  const message = use(getDeferred());
  const insertHtml = useInsertHtml();
  insertHtml(() => <script data-testid="sku-injected" data-marker={message} />);
  return <main data-testid="page">{message}</main>;
};

describe('insertHtml stream injection', () => {
  it('writes injected markup into the response before the client hydrates', async () => {
    const { html } = await renderToHtml({
      routes: [
        { path: '/', Component: () => <InjectingPage marker="shell" /> },
      ],
    });

    expect(html).toContain('data-testid="sku-injected"');
    expect(html).toContain('window.__SKU_INJECTED__="shell"');
    // First injections land in `</head>` so they stay inside the document.
    expect(html.indexOf('data-testid="sku-injected"')).toBeGreaterThan(
      html.indexOf('<head'),
    );
    expect(html.indexOf('data-testid="sku-injected"')).toBeLessThan(
      html.indexOf('</head>'),
    );
  });

  it('survives handle.waitForAll buffering', async () => {
    const { html } = await renderToHtml({
      routes: [
        {
          path: '/',
          Component: () => (
            <Suspense fallback={<p>loading</p>}>
              <DeferredInjectingPage />
            </Suspense>
          ),
          handle: { waitForAll: true },
        },
      ],
    });

    expect(html).toContain('data-testid="sku-injected"');
    expect(html).toContain('data-marker="deferred"');
    expect(html).toContain('>deferred<');
  });

  it('allows injected scripts to carry a CSP nonce from getCspNonce', async () => {
    const { createSsrRequestContextStore } =
      await import('./createSsrRequestContextStore.js');
    const { getCspNonce } = await import('sku/runtime');

    const NonceInjectingPage = () => {
      const insertHtml = useInsertHtml();
      const nonce = getCspNonce();
      insertHtml(() => (
        <script data-testid="sku-injected" nonce={nonce}>
          window.__SKU_INJECTED__=1;
        </script>
      ));
      return <main>page</main>;
    };

    const store = createSsrRequestContextStore();
    const result = await render({
      siteStaticHandlers: buildSiteStaticHandlers({
        au: [{ path: '/', Component: NonceInjectingPage }],
      }),
      request: new Request('http://localhost/'),
      req: { path: '/' } as ExpressRequest,
      assets,
      getSite,
      options: { requestContextStore: store },
    });

    if ('response' in result) {
      throw new Error('Expected a streamed document');
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
      result.commit(writable);
    });

    const html = Buffer.concat(chunks).toString('utf-8');
    const nonce = store.peekCspNonce();
    expect(nonce).toBeTruthy();
    expect(html).toContain(`nonce="${nonce}"`);
  });
});
