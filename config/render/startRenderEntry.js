import render from '__sku_alias__renderEntry'; // eslint-disable-line import/no-unresolved
import config from './startConfig.json'; // eslint-disable-line import/no-unresolved

const libraryName = SKU_LIBRARY_NAME; // eslint-disable-line

export default async ({ headTags, bodyTags, ...renderContext }) => {
  let app;
  const renderParams = { ...renderContext, ...config, libraryName };

  if (render.renderApp) {
    app = await render.renderApp(renderParams);
  }

  const result = await render.renderDocument({
    headTags,
    bodyTags,
    ...renderParams,
    app
  });

  return result;
};
