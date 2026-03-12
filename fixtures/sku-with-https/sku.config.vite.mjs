import { makeStableViteHashes } from '@sku-private/test-utils';

import baseConfig from './sku.config.mjs';

export default {
  ...baseConfig,
  bundler: 'vite',
  devServerMiddleware: './dev-middleware.vite.js',
  dangerouslySetViteConfig: makeStableViteHashes,
};
