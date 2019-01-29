import makeExtractor from '../makeExtractor';

// __sku_alias__renderEntry is a webpack alias
// pointing to the consuming apps render entry
import render from '__sku_alias__renderEntry';

export default async renderParams => {
  const { SkuProvider, getBodyTags, getHeadTags } = makeExtractor(
    renderParams.webpackStats,
    renderParams.publicPath
  );

  const app = await render.renderApp({ ...renderParams, SkuProvider });

  return await render.renderDocument({
    ...renderParams,
    app,
    bodyTags: getBodyTags(),
    headTags: getHeadTags()
  });
};
