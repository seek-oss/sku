import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeadAssets } from 'sku/runtime';
import { HeadAssetsProvider } from '#runtime/headAssets';

describe('HeadAssets', () => {
  it('renders modulepreload and stylesheet links when provider is present', () => {
    const ssrCssHref = '/virtual-ssr.css';
    const html = renderToStaticMarkup(
      <HeadAssetsProvider
        assets={{
          modulePreloads: ['/module-1.js', '/module-2.js'],
          css: ['/style.css', ssrCssHref],
          ssrCssHref,
        }}
      >
        <head>
          <HeadAssets />
        </head>
      </HeadAssetsProvider>,
    );

    expect(html).toContain('<link rel="modulepreload" href="/module-1.js"/>');
    expect(html).toContain('<link rel="modulepreload" href="/module-2.js"/>');
    expect(html).toContain('<link rel="stylesheet" href="/style.css"/>');
    expect(html).toContain(
      `<link rel="stylesheet" href="${ssrCssHref}" data-ssr-css="true"/>`,
    );
  });

  it('renders nothing and does not throw when provider is omitted', () => {
    let html = '';
    expect(() => {
      html = renderToStaticMarkup(
        <head>
          <HeadAssets />
        </head>,
      );
    }).not.toThrow();

    expect(html).toBe('<head></head>');
  });

  it('does not export HeadAssetsProvider from sku/runtime', async () => {
    expect(await import('sku/runtime')).not.toHaveProperty(
      'HeadAssetsProvider',
    );
  });
});
