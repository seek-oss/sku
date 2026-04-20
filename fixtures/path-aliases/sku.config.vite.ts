import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  pathAliases: {
    '@components/*': './src/components/*',
    '@utils/*': './src/utils/*',
    '#styles/*': './src/styles/*',
  },
  dangerouslySetViteConfig: () => ({
    ...makeStableViteHashes(),
    optimizeDeps: {
      // css resolution issues only occur during the first optimization.
      // Forcing a re-optimization to be able to test the error consistently.
      force: true,
    },
  }),
} satisfies SkuConfig;
