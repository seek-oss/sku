/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: 'seek',
  rules: {
    'no-console': 'off',
    'no-process-exit': 'off',
    'no-sync': 'off',
    'import/no-unresolved': [
      'error',
      {
        commonjs: true,
        amd: true,
        ignore: [
          '__sku_alias__renderEntry',
          '__sku_alias__serverEntry',
          '__sku_alias__clientEntry',
          '__sku_alias__webpackStats',
        ],
      },
    ],
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    // react isn't a dependency of the monorepo, so we need to tell ESLint which version to use
    react: {
      version: require('./packages/sku/node_modules/react/package.json')
        .version,
    },
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules'],
      },
    },
  },
  overrides: [
    {
      files: ['tests/**', 'test-utils/**'],
      env: {
        jest: true,
      },
      globals: {
        browser: true,
      },
    },
  ],
  globals: {
    __SKU_SRC_PATHS_0__: true,
    __SKU_SRC_PATHS_1__: true,
    __SKU_SRC_PATHS_2__: true,
    __SKU_SRC_PATHS_3__: true,
    __SKU_SRC_PATHS_4__: true,
    __SKU_SRC_PATHS_5__: true,
    __SKU_SRC_PATHS_6__: true,
    __SKU_SRC_PATHS_7__: true,
    __SKU_SRC_PATHS_8__: true,
    __SKU_SRC_PATHS_9__: true,
    __SKU_CLIENT_PATH__: true,
    __SKU_PUBLIC_PATH__: true,
    __SKU_CSP__: true,
    __SKU_DEV_HTTPS__: true,
    __SKU_DEV_MIDDLEWARE_ENABLED__: true,
    __SKU_DEV_MIDDLEWARE_PATH__: true,
    __SKU_LIBRARY_NAME__: true,
    __SKU_LIBRARY_FILE__: true,
  },
};
