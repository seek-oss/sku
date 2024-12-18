import debug from 'debug';
import { getChunkName } from '@vocab/webpack/chunk-name';
import serializeJavascript from 'serialize-javascript';
import makeExtractor from '../makeExtractor.jsx';
import clientContextKey from '../clientContextKey.js';
import createCSPHandler from '../csp.js';
import type { RenderAppProps } from '../../../sku-types.d.ts';

import { renderToStringAsync } from './render-to-string.js';

import render from '__sku_alias__renderEntry';

const libraryName = __SKU_LIBRARY_NAME__;
const libraryFile = __SKU_LIBRARY_FILE__;
const publicPath = __SKU_PUBLIC_PATH__;
const csp = __SKU_CSP__;

export const serializeConfig = (config: object) =>
  `<script id="${clientContextKey}" type="application/json">${serializeJavascript(
    config,
    { isJSON: true },
  )}</script>`;

export default async (renderParams: RenderAppProps) => {
  const renderContext = { ...renderParams, libraryName, libraryFile };

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
      // @ts-expect-error - addChunk is not on the ChunkExtractor type
      _addChunk: (chunkName) => extractor.addChunk(chunkName),
      SkuProvider,
      renderToStringAsync,
    });
    if (renderContext.language) {
      debug('sku:render:language')(
        `Using language "${renderContext.language}" for route "${renderContext.route}"`,
      );
      // @ts-expect-error - addChunk is not on the ChunkExtractor type
      extractor.addChunk(getChunkName(renderContext.language));
    } else {
      debug('sku:render:language')(
        `No language on route "${renderContext.route}"`,
      );
    }
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
      isDevelopment: process.env.NODE_ENV === 'development',
    });

    return cspHandler.handleHtml(result);
  }

  return result;
};
