import type { SkuConfig } from 'sku';

export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  pathAliases: [
    { '@components/*': './src/components/*' },
    { '@utils/*': './src/utils/*' },
  ],
} satisfies SkuConfig;
