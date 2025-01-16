import type { SkuContext } from '@/context/createSkuContext.js';
import dedent from 'dedent';

export const APP_BODY = '<!--app-body-->';

export const getOpeningHtml = ({
  headTags,
  rootId = 'root',
  nonce = '%NONCE%',
  title = 'Sku Project',
}: {
  headTags?: string;
  rootId?: string;
  title?: string;
  nonce?: string;
}) => dedent`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${headTags}
  </head>
  <body>
    <div id="${rootId}">`;

export const getClosingHtml = ({
  bodyTags,
}: {
  bodyTags?: string;
}) => dedent`</div>
${bodyTags}
</body>
</html>`;

export const createDefaultHtmlIndex = ({
  title,
  entryPath,
}: {
  title: string;
  entryPath: string;
}) => {
  const openingHtml = getOpeningHtml({ title });
  const closingHtml = getClosingHtml({
    bodyTags: `<script type="module" src="${entryPath}"></script>`,
  });

  return `${openingHtml}${APP_BODY}${closingHtml}`;
};

export const createIndexFile = (skuContext: SkuContext) => {
  const { skuConfig } = skuContext;
  const { clientEntry } = skuConfig;

  const indexHtml = createDefaultHtmlIndex({
    title: 'Sku Project',
    entryPath: clientEntry,
  });

  return indexHtml;
};
