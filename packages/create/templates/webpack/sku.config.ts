import type { SkuConfig } from 'sku';

const skuConfig = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  publicPath: '/path/to/public/assets/', // <-- Required for sku build output
} satisfies SkuConfig;

export default skuConfig;
