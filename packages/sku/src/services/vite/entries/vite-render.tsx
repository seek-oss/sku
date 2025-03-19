import { createCollector } from '@/services/vite/loadable/collector.js';
import debug from 'debug';
import { createPreRenderedHtml } from '@/services/vite/helpers/html/createPreRenderedHtml.jsx';

import render from '__sku_alias__renderEntry';
import type { ViteRenderFunction } from '@/types/types.js';

const log = debug('sku:vite-render');

export const viteRender: ViteRenderFunction = async ({
  environment,
  language,
  route,
  routeName,
  site,
  clientEntry,
}) => {
  log(`Rendering route: ${routeName}:${route}`);

  const loadableCollector = createCollector({});

  return createPreRenderedHtml({
    environment,
    language,
    route,
    routeName,
    site,
    render,
    loadableCollector,
    hooks: {
      getBodyTags: () => [
        `<script type="module" src="${clientEntry}"></script>`,
      ],
    },
  });
};
