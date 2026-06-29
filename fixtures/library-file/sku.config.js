import { makeStableHashes } from '@sku-private/test-utils';

export default {
  libraryEntry: 'src/library.js',
  renderEntry: 'src/render.js',
  libraryName: 'MyLibrary',
  libraryFile: 'my-library',
  port: 8086,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
