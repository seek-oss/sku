import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  port: 4001,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
  target: 'custom-output-directory',
} satisfies SkuConfig;
