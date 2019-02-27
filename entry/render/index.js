import serializeJavascript from 'serialize-javascript';
import makeExtractor from '../makeExtractor';
import clientContextKey from '../clientContextKey';

import render from '__sku_alias__renderEntry';

const libraryName = SKU_LIBRARY_NAME;
const publicPath = __SKU_PUBLIC_PATH__;

export const serializeConfig = config =>
  `<script>window.${clientContextKey} = ${serializeJavascript(
    config,
  )};</script>`;

export default async renderParams => {
  const renderContext = { ...renderParams, libraryName };

  let app;
  let clientContext = {};

  const { webpackStats } = renderContext;

  const { SkuProvider, getBodyTags, getHeadTags } = makeExtractor(
    webpackStats,
    publicPath,
  );

  // renderApp is optional for libraries
  if (render.renderApp) {
    app = await render.renderApp({
      ...renderContext,
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

  return result;
};
