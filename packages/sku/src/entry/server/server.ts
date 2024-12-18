import { getChunkName } from '@vocab/webpack/chunk-name';
import path from 'node:path';
import express, { static as expressStatic, type Express } from 'express';
import makeExtractor from '../makeExtractor.jsx';
import createCSPHandler from '../csp.js';
import serverExports from '__sku_alias__serverEntry';
import webpackStats from '__sku_alias__webpackStats';
import { createRequire } from 'node:module';
import type { RenderCallbackParams } from '../../../sku-types.d.ts';

const publicPath = __SKU_PUBLIC_PATH__;
const csp = __SKU_CSP__;

const serverOptions = serverExports({ publicPath });

const { middleware, onStart, renderCallback } = serverOptions;

const app: Express = express();

const env = process.env.NODE_ENV || 'development';

const require = createRequire(import.meta.url);

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
  app.use(expressStatic(path.join(__dirname, './')));
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

  const addLanguageChunk: RenderCallbackParams['addLanguageChunk'] = (
    language,
  ) =>
    // @ts-expect-error - addChunk is not defined in ChunkExtractor
    extractor.addChunk(getChunkName(language));

  const result: Express = renderCallback(
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
