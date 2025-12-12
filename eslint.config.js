// @ts-check
import seek from 'eslint-config-seek/vitest';
import * as jsdocModule from 'eslint-plugin-jsdoc';
import * as nodePluginModule from 'eslint-plugin-n';

const jsdoc = jsdocModule.default;
const nodePlugin = nodePluginModule.default;

export default [
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
      '**/templates/',
      'fixtures/**/*',
      '**/__testfixtures__/**',
      '**/@loadable/**/*',
    ],
  },
  ...seek,
  {
    plugins: {
      jsdoc,
      n: nodePlugin,
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

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.action.js'],
              message:
                'Please dynamically import action modules to keep the CLI fast',
            },
          ],
        },
      ],

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
            'virtual:sku/polyfills',
          ],
        },
      ],

      'one-var': ['error', 'never'],
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'n/prefer-node-protocol': ['error'],
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
        browser: true,
      },
    },
  },
];
