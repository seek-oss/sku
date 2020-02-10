const loaders = require('./loaders');
const { resolvePackage } = require('./resolvePackage');

module.exports = {
  ...loaders,
  resolvePackage,
  TYPESCRIPT: /(?!\.css)\.(ts|tsx)$/,
  JAVASCRIPT: /(?!\.css)\.js$/,
  CSS_IN_JS: /\.css\.js$/,
  LESS: /\.less$/,
  IMAGE: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
  SVG: /\.svg$/,
};
