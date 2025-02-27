import render from '__sku_alias__renderEntry';
import { createPreRenderedHtml } from '@/services/vite/helpers/html/createPreRenderedHtml.js';
import type { ViteRenderAppProps } from '@/types/types.js';
import { createCollector } from '@/services/vite/loadable/collector.js';

export const viteRender = async ({
  url,
  site,
  clientEntry,
}: {
  url: ViteRenderAppProps['url'];
  site: ViteRenderAppProps['site'];
  clientEntry: string;
}) => {
  const loadableCollector = createCollector({});

  return await createPreRenderedHtml({
    url,
    render,
    site,
    renderContext: {
      loadableCollector,
    },
    hooks: {
      getBodyTags: () => `<script type="module" src="${clientEntry}"></script>`,
    },
  });
};
