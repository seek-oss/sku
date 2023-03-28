import render from '__sku_alias__renderEntry';

const libraryName = SKU_LIBRARY_NAME;
const libraryFile = SKU_LIBRARY_FILE;
const publicPath = __SKU_PUBLIC_PATH__;

const libraryPath = `${publicPath}${libraryFile ?? libraryName}`;

export default (renderParams) => {
  const renderContext = { ...renderParams, libraryName, libraryFile };

  return render.renderDocument({
    ...renderContext,
    headTags: `<link rel="stylesheet" type="text/css" href="${libraryPath}.css">`,
    bodyTags: `<script src="${libraryPath}.js"></script>`,
  });
};
