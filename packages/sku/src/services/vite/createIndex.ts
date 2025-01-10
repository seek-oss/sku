import type { SkuContext } from '@/context/createSkuContext.js';
import dedent from 'dedent';

export const APP_HEAD = '<!--app-head-->';
export const APP_HTML = '<!--app-html-->';

export const createDefaultHtmlIndex = ({
  entryPath,
  headTags,
  bodyTags,
  rootId = 'root',
}: {
  entryPath: string;
  headTags: string;
  bodyTags?: string;
  rootId?: string;
}) => dedent`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${headTags}
    ${APP_HEAD}
  </head>
  <body>
    <div id="${rootId}">${APP_HTML}</div>
    <script type="module" src="${entryPath}"></script>
    ${bodyTags || ''}
  </body>
</html>`;

export const createIndexFile = (skuContext: SkuContext) => {
  const { skuConfig } = skuContext;
  const { clientEntry } = skuConfig;

  const headTags = `<title>Sku Project</title>\n`;

  const indexHtml = createDefaultHtmlIndex({
    headTags,
    entryPath: clientEntry,
  });

  return indexHtml;
};
