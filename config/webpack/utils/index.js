const loaders = require('./loaders');
const { resolvePackage } = require('./resolvePackage');

module.exports = {
  ...loaders,
  resolvePackage,
  TYPESCRIPT: /\.(ts|tsx)$/,
  JAVASCRIPT: /\.js$/,
  LESS: /\.less$/,
  IMAGE: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
  SVG: /\.svg$/,
};
