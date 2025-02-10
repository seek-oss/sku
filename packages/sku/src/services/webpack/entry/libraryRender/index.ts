import render from '__sku_alias__renderEntry';
import type { RenderAppProps } from '../../../../types/types.js';

const libraryName = __SKU_LIBRARY_NAME__;
const libraryFile = __SKU_LIBRARY_FILE__;
const publicPath = __SKU_PUBLIC_PATH__;

const libraryPath = `${publicPath}${libraryFile ?? libraryName}`;

export default (renderParams: RenderAppProps) => {
  const renderContext = { ...renderParams, libraryName, libraryFile };

  return render.renderDocument({
    ...renderContext,
    headTags: `<link rel="stylesheet" type="text/css" href="${libraryPath}.css">`,
    bodyTags: `<script src="${libraryPath}.js"></script>`,
  });
};
