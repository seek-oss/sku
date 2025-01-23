import { inlineCriticalCss } from '@/services/vite/helpers/css-extractor.js';

import render from '__sku_alias__renderEntry';
import { createPreRenderedHtml } from '../createPreRenderedHtml.js';

export const viteRender = async ({
  url,
  site,
  clientEntry,
}: {
  url: string;
  site: string;
  clientEntry: string;
}) => {
  const criticalCssPlaceholder = '<!-- critical-css-placeholder -->';

  const app = render.renderApp({ site });

  const appWithInlineCss = await inlineCriticalCss(
    app + criticalCssPlaceholder,
    criticalCssPlaceholder,
  );

  const html = await createPreRenderedHtml({
    url,
    render,
    site,
    manifest: {},
    extraBodyTags: `${criticalCssPlaceholder}<script type="module" src="${clientEntry}"></script>`,
  });

  const newHtml = await inlineCriticalCss(html, criticalCssPlaceholder);

  return newHtml;
};
