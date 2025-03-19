import render from '__sku_alias__renderEntry';
import { createPreRenderedHtml } from '@/services/vite/helpers/html/createPreRenderedHtml.js';
import type { ViteRenderFunction } from '@/types/types.js';
import { createCollector } from '@/services/vite/loadable/collector.js';

export const viteRender: ViteRenderFunction = async ({
  clientEntry,
  ...context
}) => {
  const loadableCollector = createCollector({});

  return await createPreRenderedHtml({
    ...context,
    render,
    hooks: {
      getBodyTags: () => `<script type="module" src="${clientEntry}"></script>`,
    },
    collector: loadableCollector,
  });
};
