// '__sku_alias__renderEntry' is a webpack alias
// pointing to the consuming apps render entry
import render from '__sku_alias__renderEntry';
// 'startConfig.json' is a file created by the htmlRenderPlugin
// it contains the current site/environment config to be rendered
import config from './startConfig.json'; // eslint-disable-line import/no-unresolved

const libraryName = SKU_LIBRARY_NAME; // eslint-disable-line no-undef

export default async ({ headTags, bodyTags, ...renderContext }) => {
  let app;
  const renderParams = { ...renderContext, ...config, libraryName };

  // renderApp is optional for libraries
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
