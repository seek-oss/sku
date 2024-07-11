import type { SkuConfig } from 'sku';

const skuConfig: SkuConfig = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  storybookPort: 8089,
  devServerMiddleware: './dev-middleware.js',
  storybookAddons: ['@storybook/addon-controls'],
  storybookStoryStore: false,
};

export default skuConfig;
