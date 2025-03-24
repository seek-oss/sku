import baseConfig from './sku.config.js';

export default {
  ...baseConfig,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  renderEntry: 'src/render-vite.jsx',
};
