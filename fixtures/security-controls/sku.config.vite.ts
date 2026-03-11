import { makeStableViteHashes } from '@sku-private/test-utils';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  bundler: 'vite',
  dangerouslySetViteConfig: makeStableViteHashes,
};
