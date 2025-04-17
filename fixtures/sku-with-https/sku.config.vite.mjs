import baseConfig from './sku.config.mjs';

export default {
  ...baseConfig,
  port: baseConfig.port + 10000,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  devServerMiddleware: './dev-middleware.vite.js',
};
