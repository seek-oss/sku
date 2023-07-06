import { makeStableHashes } from '@sku-private/test-utils';

export default {
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
  setupTests: 'src/setupTests.js',
};
