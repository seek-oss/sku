const path = require('path');
const express = require('express');
const serverExports = require('__sku_alias__serverEntry').default; // eslint-disable-line import/no-unresolved

const serverOptions =
  typeof serverExports === 'function'
    ? serverExports({ publicPath: __SKU_PUBLIC_PATH__ })
    : serverExports;

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
