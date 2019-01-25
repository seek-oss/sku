import makeExtractor from '../makeExtractor';

// '__sku_alias__renderEntry' is a webpack alias
// pointing to the consuming apps render entry
import render from '__sku_alias__renderEntry';

// 'startConfig.json' is a file created by the htmlRenderPlugin
// it contains the current site/environment config to be rendered
import config from './startConfig.json'; // eslint-disable-line import/no-unresolved

const libraryName = SKU_LIBRARY_NAME; // eslint-disable-line no-undef

export default async renderParams => {
  let app;
  const renderContext = { ...renderParams, ...config, libraryName };

  const { SkuProvider, getBodyTags, getHeadTags } = makeExtractor(
    renderParams.webpackStats,
    renderParams.entrypoint,
    renderParams.publicPath
  );

  // renderApp is optional for libraries
  if (render.renderApp) {
    app = await render.renderApp({ ...renderContext, SkuProvider });
  }

  const result = await render.renderDocument({
    ...renderContext,
    headTags: getHeadTags(),
    bodyTags: getBodyTags(),
    app
  });

  return result;
};
