import {
  ListExternalsWebpackPlugin,
  makeStableHashes,
} from '@sku-private/test-utils';

import baseConfig from './sku.config.mjs';

export default {
  ...baseConfig,
  bundler: 'webpack',
  devServerMiddleware: './dev-middleware.cjs',
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    makeStableHashes(config);

    return config;
  },
};
