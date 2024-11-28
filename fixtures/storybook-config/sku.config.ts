import type { SkuConfig } from 'sku';

const skuConfig: SkuConfig = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  devServerMiddleware: './dev-middleware.js',
  dangerouslySetTSConfig: (config) => ({
    ...config,
    include: ['**/*', '.storybook/*'],
  }),
  eslintIgnore: ['**/storybook-static/'],
};

export default skuConfig;
