const loaders = require('./loaders');
const { resolvePackage } = require('./resolvePackage');
const { js, ts } = require('eslint-config-seek/extensions');

module.exports = {
  ...loaders,
  resolvePackage,
  TYPESCRIPT: new RegExp(`\.(${ts.join('|')})$`),
  JAVASCRIPT: new RegExp(`\.(${js.join('|')})$`),
  LESS: /\.less$/,
  IMAGE: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
  SVG: /\.svg$/,
};
