const useVitestLocalExpect = require('./use-vitest-local-expect.cjs');

const plugin = {
  // preferred location of name and version
  meta: {
    name: 'eslint-plugin-sku-vitest',
    version: '0.1',
    namespace: 'sku-vitest',
  },
  rules: {
    'use-vitest-local-expect': useVitestLocalExpect,
  },
};

module.exports = plugin;
