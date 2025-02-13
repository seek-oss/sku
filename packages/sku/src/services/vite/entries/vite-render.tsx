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
}) =>
  await createPreRenderedHtml({
    url,
    render,
    site,
    hooks: {
      getBodyTags: () => `<script type="module" src="${clientEntry}"></script>`,
    },
  });
