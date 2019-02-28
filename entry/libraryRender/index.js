import render from '__sku_alias__renderEntry';

const libraryName = SKU_LIBRARY_NAME;
const publicPath = __SKU_PUBLIC_PATH__;

export default async renderParams => {
  const renderContext = { ...renderParams, libraryName };

  return await render.renderDocument({
    ...renderContext,
    headTags: `<link rel="stylesheet" type="text/css" href="${publicPath}${libraryName}.css">`,
    bodyTags: `<script src="${publicPath}${libraryName}.js"></script>`,
  });
};
