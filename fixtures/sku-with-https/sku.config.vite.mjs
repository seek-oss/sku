import baseConfig from './sku.config.mjs';

export default {
  ...baseConfig,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  httpsDevServer: false, // not yet supported
  devServerMiddleware: './dev-middleware.vite.js',
};
