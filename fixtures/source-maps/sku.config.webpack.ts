import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  bundler: 'webpack',
  dangerouslySetWebpackConfig: (config: any) => makeStableHashes(config),
} satisfies SkuConfig;
