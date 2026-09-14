import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  DocumentAssetLinks,
  SKU_STYLESHEET_PRECEDENCE,
} from './documentAssets.js';

describe('DocumentAssetLinks', () => {
  it('renders modulepreload and stylesheet links with sku precedence', () => {
    const ssrCssHref = '/virtual-ssr.css';
    const html = renderToStaticMarkup(
      <DocumentAssetLinks
        assets={{
          modulePreloads: ['/module-1.js', '/module-2.js'],
          css: ['/style.css', ssrCssHref],
          ssrCssHref,
        }}
      />,
    );

    expect(html).toContain('<link rel="modulepreload" href="/module-1.js"/>');
    expect(html).toContain('<link rel="modulepreload" href="/module-2.js"/>');
    expect(html).toContain(`precedence="${SKU_STYLESHEET_PRECEDENCE}"`);
    expect(html).toContain('href="/style.css"');
    expect(html).toContain(`href="${ssrCssHref}"`);
    expect(html).toContain('data-ssr-css');
  });
});
