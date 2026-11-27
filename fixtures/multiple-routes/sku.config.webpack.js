import { makeStableHashes } from '@sku-private/test-utils';

import baseConfig from './sku.config.js';

export default {
  ...baseConfig,
  bundler: 'webpack',
  testRunner: 'jest',
  setupTests: './setupTests.js',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
