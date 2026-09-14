import {
  ListExternalsWebpackPlugin,
  makeStableHashes,
} from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.base.js';

export default {
  ...baseConfig,

  clientEntry: 'src/webpack-static/client.tsx',
  renderEntry: 'src/webpack-static/render.tsx',

  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    makeStableHashes(config);

    return config;
  },
} satisfies SkuConfig;
