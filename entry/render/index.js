import serializeJavascript from 'serialize-javascript';
import makeExtractor from '../makeExtractor';
import clientContextKey from '../clientContextKey';
import createCSPHandler from '../csp';

import render from '__sku_alias__renderEntry';

const libraryName = SKU_LIBRARY_NAME;
const publicPath = __SKU_PUBLIC_PATH__;
const csp = __SKU_CSP__;

export const serializeConfig = (config) =>
  `<script id="${clientContextKey}" type="application/json">${serializeJavascript(
    config,
    { isJSON: true },
  )}</script>`;

export default async (renderParams) => {
  const renderContext = { ...renderParams, libraryName };

  let app;
  let clientContext = {};

  const { webpackStats } = renderContext;

  const { SkuProvider, getBodyTags, getHeadTags, extractor } = makeExtractor(
    webpackStats,
    publicPath,
  );

  // renderApp is optional for libraries
  if (render.renderApp) {
    app = await render.renderApp({
      ...renderContext,
      _addChunk: (chunkName) => extractor.addChunk(chunkName),
      SkuProvider,
    });
  }

  if (render.provideClientContext) {
    clientContext = await render.provideClientContext({
      ...renderContext,
      app,
    });
  }

  const bodyTags =
    Object.keys(clientContext).length > 0
      ? [serializeConfig(clientContext), getBodyTags()].join('\n')
      : getBodyTags();

  const result = await render.renderDocument({
    ...renderContext,
    headTags: getHeadTags(),
    bodyTags,
    app,
  });

  if (csp.enabled) {
    const cspHandler = createCSPHandler({
      extraHosts: [publicPath, ...csp.extraHosts],
    });

    return cspHandler.handleHtml(result);
  }

  return result;
};
