import render from '__sku_alias__renderEntry';
import { createPreRenderedHtml } from '../createPreRenderedHtml.js';
import type { ViteRenderAppProps } from '@/types/types.js';

export const viteRender = async ({
  url,
  site,
  clientEntry,
}: {
  url: ViteRenderAppProps['url'];
  site: ViteRenderAppProps['site'];
  clientEntry: string;
}) =>
  await createPreRenderedHtml({
    url,
    render,
    site,
    hooks: {
      getBodyTags: () => `<script type="module" src="${clientEntry}"></script>`,
    },
  });
