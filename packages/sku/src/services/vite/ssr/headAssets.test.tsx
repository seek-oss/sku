import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeadAssets, HeadAssetsProvider } from './headAssets.js';
import { SSR_CSS_VIRTUAL_HREF } from '../plugins/ssrCss/constants.js';

describe('HeadAssets', () => {
  it('renders modulepreload and stylesheet links when provider is present', () => {
    const html = renderToStaticMarkup(
      <HeadAssetsProvider
        assets={{
          modulePreloads: ['/module-1.js', '/module-2.js'],
          css: ['/style.css', SSR_CSS_VIRTUAL_HREF],
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
      `<link rel="stylesheet" href="${SSR_CSS_VIRTUAL_HREF}" data-ssr-css="true"/>`,
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
});
