import config from './sku.config.mjs';

export default {
  ...config,
  devServerMiddleware: './dev-middleware-invalid.cjs',
};
