const loaders = require('./loaders');
const { resolvePackage } = require('./resolvePackage');

// TODO: Figure out a better way to share this config. This is currently copy-pasted from
// `eslint-config-seek`
const extensions = {
  js: ['js', 'cjs', 'mjs', 'jsx'],
  ts: ['ts', 'cts', 'mts', 'tsx'],
};

module.exports = {
  ...loaders,
  resolvePackage,
  TYPESCRIPT: new RegExp(`\.(${extensions.ts.join('|')})$`),
  JAVASCRIPT: new RegExp(`\.(${extensions.js.join('|')})$`),
  IMAGE: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
  SVG: /\.svg$/,
};
