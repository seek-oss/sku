const path = require('path');
const express = require('express');
const {
  renderCallback,
  middleware
} = require('__sku_alias__serverEntry').default;
const port = process.env.SKU_PORT || 8080;

const app = express();

const env = process.env.NODE_ENV || 'development';

console.log('starting server at', __dirname);

if (env === 'development') {
  console.log('starting static server at', __dirname);
  app.use(express.static(path.join(__dirname, './')));
}

if (middleware) {
  app.use(middleware);
}
app.get('*', renderCallback);

export default app;
