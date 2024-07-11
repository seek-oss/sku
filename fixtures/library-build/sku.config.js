const { makeStableHashes } = require('@sku-private/test-utils');

module.exports = {
  libraryEntry: 'src/library.js',
  renderEntry: 'src/render.js',
  libraryName: 'MyLibrary',
  port: 8085,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
