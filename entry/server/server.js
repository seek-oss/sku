import path from 'path';
import express from 'express';
import makeExtractor from '../makeExtractor';
import serverExports from '__sku_alias__serverEntry';
import webpackStats from '__sku_alias__webpackStats';

const publicPath = __SKU_PUBLIC_PATH__; // eslint-disable-line no-undef

const serverOptions = serverExports({ publicPath });

const { renderCallback, middleware, onStart } = serverOptions;

const app = express();

const env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  app.use(express.static(path.join(__dirname, './')));
}

if (middleware) {
  app.use(middleware);
}
app.get('*', (...args) =>
  renderCallback(makeExtractor(webpackStats, publicPath), ...args),
);

export { app, onStart };
