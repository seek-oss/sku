import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  pathAliases: {
    '@components/*': './src/components/*',
    '@utils/*': './src/utils/*',
  },
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
