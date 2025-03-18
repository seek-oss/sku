import render from '__sku_alias__renderEntry';
import { createPreRenderedHtml } from '@/services/vite/helpers/html/createPreRenderedHtml.jsx';
import type { ViteRenderAppProps } from '@/types/types.js';
import type { NormalizedRoute } from '@/context/createSkuContext.js';

export const viteRender = async ({
  url,
  site,
  clientEntry,
  route,
}: {
  url: ViteRenderAppProps['url'];
  site: ViteRenderAppProps['site'];
  clientEntry: string;
  route: NormalizedRoute;
}) =>
  await createPreRenderedHtml({
    url,
    render,
    site,
    clientEntry,
    route,
  });
