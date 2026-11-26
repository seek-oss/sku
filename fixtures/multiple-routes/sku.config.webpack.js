import { makeStableHashes } from '@sku-private/test-utils';

import baseConfig from './sku.config.js';

export default {
  ...baseConfig,
  bundler: 'webpack',
  setupTests: './setupTests.js',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
