const path = require('path');
const express = require('express');
const renderScriptTag = require('../../lib/renderScriptTag');
const serverExports = require('__sku_alias__serverEntry').default;
const assets = require('__sku_alias__assets');

const publicPath = __SKU_PUBLIC_PATH__; // eslint-disable-line no-undef

const makeArray = a => (Array.isArray(a) ? a : [a]);

const scripts = makeArray(assets[Object.keys(assets)[0]].js);
const styles = makeArray(assets[Object.keys(assets)[0]].css);

const bodyTags = scripts
  .map(chunkFile => renderScriptTag(chunkFile))
  .join('\n');
const headTags = styles
  .map(
    chunkFile => `<link rel="stylesheet" type="text/css" href="${chunkFile}" />`
  )
  .join('\n');

const serverOptions = serverExports({ publicPath, headTags, bodyTags });

const { renderCallback, middleware, onStart } = serverOptions;

const app = express();

const env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  app.use(express.static(path.join(__dirname, './')));
}

if (middleware) {
  app.use(middleware);
}
app.get('*', renderCallback);

export { app, onStart };
