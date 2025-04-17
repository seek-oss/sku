import baseConfig from './sku.config.mjs';

export default {
  ...baseConfig,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  devServerMiddleware: './dev-middleware.vite.js',
};
