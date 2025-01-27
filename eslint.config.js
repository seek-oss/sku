const seek = require('eslint-config-seek');
const jsdoc = require('eslint-plugin-jsdoc');
const unicorn = require('eslint-plugin-unicorn');
const globals = require('globals');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    ignores: [
      '**/*.less.d.ts',
      '**/node_modules',
      '**/coverage/',
      '**/dist/',
      '**/dist-build/',
      '**/dist-start/',
      '**/storybook-static/',
      '**/report/',
      '**/template/',
      'test/test-cases/*/*',
      '!test/test-cases/*/*.test.js',
      'fixtures/*/*',
      '**/@loadable/**/*',
    ],
  },
  ...seek,
  {
    plugins: {
      jsdoc,
      unicorn,
      import: importPlugin,
    },

    languageOptions: {
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
    },

    settings: {
      react: {
        version: '18.3.1',
      },

      'import-x/resolver': {
        node: {
          moduleDirectory: ['node_modules'],
        },
        typescript: true,
      },
    },

    rules: {
      'jsdoc/check-alignment': 2,
      'jsdoc/check-types': 2,

      'jsdoc/no-multi-asterisks': [
        'error',
        {
          allowWhitespace: true,
        },
      ],

      'jsdoc/require-asterisk-prefix': ['error', 'always'],
      'no-console': 'off',
      'no-process-exit': 'off',
      'no-sync': 'off',

      'import-x/no-unresolved': [
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

      'one-var': ['error', 'never'],
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'unicorn/prefer-node-protocol': 'error',
    },
  },
  {
    settings: {
      'import-x/resolver': {
        typescript: {
          project: '**/*/tsconfig.json',
        },
      },
    },
  },
  {
    files: ['tests/**', 'test-utils/**'],

    languageOptions: {
      globals: {
        ...globals.jest,
        browser: true,
      },
    },
  },
];
