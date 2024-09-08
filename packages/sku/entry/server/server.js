import { getChunkName } from '@vocab/webpack/chunk-name';
import path from 'node:path';
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
  if (__SKU_DEV_MIDDLEWARE_ENABLED__) {
    const devServerMiddleware = require(__SKU_DEV_MIDDLEWARE_PATH__);
    if (devServerMiddleware && typeof devServerMiddleware === 'function') {
      // Allow specific static files to be handled earlier via middleware.
      // E.g. web fonts, etc.
      devServerMiddleware(app);
    }
  }

  // Fallthrough to serve any static file requests from root
  // E.g. compiled output files and images
  // eslint-disable-next-line import-x/no-named-as-default-member -- static is a reserved keyword
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
      isDevelopment: env === 'development',
    });
  }

  const { SkuProvider, extractor, flushHeadTags, getHeadTags, getBodyTags } =
    makeExtractor(webpackStats, publicPath, cspHandler);
  /** @type {import("../../sku-types.d.ts").RenderCallbackParams['addLanguageChunk']} */
  const addLanguageChunk = (language) =>
    extractor.addChunk(getChunkName(language));

  /** @type {import('express').Express} */
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
