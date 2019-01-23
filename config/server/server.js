const path = require('path');
const express = require('express');
const makeExtractor = require('../render/makeExtractor');
const serverExports = require('__sku_alias__serverEntry').default; // eslint-disable-line import/no-unresolved
const webpackStats = require('__sku_alias__assets'); // eslint-disable-line import/no-unresolved

const publicPath = __SKU_PUBLIC_PATH__; // eslint-disable-line no-undef

// default entrypoint
const extractor = makeExtractor(webpackStats, 'main');

const serverOptions = serverExports({ publicPath, extractor });

const { renderCallback, middleware } = serverOptions;

const app = express();

const env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  app.use(express.static(path.join(__dirname, './')));
}

if (middleware) {
  app.use(middleware);
}
app.get('*', renderCallback);

export default app;
