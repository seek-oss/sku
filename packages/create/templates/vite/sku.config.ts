import type { SkuConfig } from 'sku';

const skuConfig = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  publicPath: '/path/to/public/assets/', // <-- Required for sku build output
  __UNSAFE_EXPERIMENTAL__testRunner: 'vitest',
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
} satisfies SkuConfig;

export default skuConfig;
