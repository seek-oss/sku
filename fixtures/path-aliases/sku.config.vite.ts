import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  pathAliases: {
    '@components/*': './src/components/*',
    '@utils/*': './src/utils/*',
  },
  __UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
