import type { SkuConfig } from 'sku';

const skuConfig: SkuConfig = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  storybookPort: 8089,
  orderImports: true,
  devServerMiddleware: './dev-middleware.js',
};

export default skuConfig;
