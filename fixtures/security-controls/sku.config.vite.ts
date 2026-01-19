import { makeStableViteHashes } from '@sku-private/test-utils';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  port: baseConfig.port + 10000,
  bundler: 'vite',
  dangerouslySetViteConfig: makeStableViteHashes,
};
