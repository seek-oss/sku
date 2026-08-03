import type { SkuConfig } from 'sku';

const skuConfig: SkuConfig = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  devServerMiddleware: './dev-middleware.js',
  dangerouslySetTSConfig: (config) => ({
    ...config,
    include: ['**/*', '.storybook/*', '.storybook-vite/*'],
  }),
  eslintIgnore: ['**/storybook-static/', '**/storybook-static-vite/'],
};

export default skuConfig;
