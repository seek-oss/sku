import { getChunkName } from '@vocab/webpack/chunk-name';
import path from 'path';
import express from 'express';
import makeExtractor from '../makeExtractor';
import createCSPHandler from '../csp';
import serverExports from '__sku_alias__serverEntry';
import webpackStats from '__sku_alias__webpackStats';

const publicPath = __SKU_PUBLIC_PATH__;
const csp = __SKU_CSP__;

const serverOptions = serverExports({ publicPath });

const { middleware, onStart, renderCallback } = serverOptions;

const app = express();

const env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  app.use(express.static(path.join(__dirname, './')));
}

if (env !== 'development') {
  // Disable x-powered-by header according to Express Best Practice
  // https://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
  app.disable('x-powered-by');
}

if (middleware) {
  app.use(middleware);
}

app.get('*', (...args) => {
  let cspHandler;

  if (csp.enabled) {
    cspHandler = createCSPHandler({
      extraHosts: [publicPath, ...csp.extraHosts],
    });
  }

  const {
    SkuProvider,
    extractor,
    flushHeadTags,
    getHeadTags,
    getBodyTags,
  } = makeExtractor(webpackStats, publicPath, cspHandler);
  const addLanguageChunk = (language) =>
    extractor.addChunk(getChunkName(language));

  const result = renderCallback(
    {
      SkuProvider,
      addLanguageChunk,
      getBodyTags,
      getHeadTags,
      extractor,
      flushHeadTags,
      registerScript: cspHandler ? cspHandler.registerScript : undefined,
    },
    ...args,
  );
  return result;
});

export { app, onStart };
