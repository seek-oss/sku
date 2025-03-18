import render from '__sku_alias__renderEntry';
import { createPreRenderedHtml } from '@/services/vite/helpers/html/createPreRenderedHtml.js';
import type { ViteRenderAppProps } from '@/types/types.js';

export const viteRender = async ({
  url,
  site,
  clientEntry,
}: {
  url: ViteRenderAppProps['url'];
  site: ViteRenderAppProps['site'];
  clientEntry: string;
}) => {
  return await createPreRenderedHtml({
    url,
    render,
    site,
  });
};
