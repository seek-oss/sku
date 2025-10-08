import { makeStableViteHashes } from '@sku-private/test-utils';

import baseConfig from './sku.config.js';

export default {
  ...baseConfig,
  bundler: 'vite',
  dangerouslySetViteConfig: makeStableViteHashes,
};
