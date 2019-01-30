import serializeJavascript from 'serialize-javascript';
import makeExtractor from '../makeExtractor';
import clientContextKey from '../clientContextKey';

import render from '__sku_alias__renderEntry';

export const serializeConfig = config =>
  `<script>window.${clientContextKey} = ${serializeJavascript(
    config
  )};</script>`;

export default async renderParams => {
  let app;
  let clientContext = {};

  const { webpackStats, publicPath } = renderParams;

  const { SkuProvider, getBodyTags, getHeadTags } = makeExtractor(
    webpackStats,
    publicPath
  );

  // renderApp is optional for libraries
  if (render.renderApp) {
    app = await render.renderApp({
      ...renderParams,
      SkuProvider
    });
  }

  if (render.provideClientContext) {
    clientContext = await render.provideClientContext({ ...renderParams, app });
  }

  const bodyTags =
    Object.keys(clientContext).length > 0
      ? [serializeConfig(clientContext), getBodyTags()].join('\n')
      : getBodyTags();

  const result = await render.renderDocument({
    ...renderParams,
    headTags: getHeadTags(),
    bodyTags,
    app
  });

  return result;
};
