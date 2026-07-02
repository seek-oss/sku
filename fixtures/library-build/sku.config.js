import { makeStableHashes } from '@sku-private/test-utils';

export default {
  libraryEntry: 'src/library.js',
  renderEntry: 'src/render.js',
  libraryName: 'MyLibrary',
  port: 8085,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
