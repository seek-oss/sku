// @ts-check
import plugin from '@eslint/markdown';
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
      'site/.vitepress/cache/',
      'site/.vitepress/dist/',
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
        __SKU_DEFAULT_SERVER_PORT__: true,
        __SKU_DEV_HTTPS__: true,
        __SKU_DEV_MIDDLEWARE_ENABLED__: true,
        __SKU_DEV_MIDDLEWARE_PATH__: true,
        __SKU_LIBRARY_NAME__: true,
        __SKU_LIBRARY_FILE__: true,
      },
    },

    settings: {
      react: {
        version: '19.1.0',
      },

      'import-x/resolver': {
        node: true,
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
      '@typescript-eslint/no-non-null-assertion': 'error',

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
                'Please dynamically import action modules to keep the CLI fast.',
            },
          ],
          paths: [
            {
              name: 'node:util',
              importNames: ['styleText'],
              message:
                "Please use sku's semantic console styling utils from `@sku-private/utils/console` instead.",
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
            '__sku_alias__routesEntry',
            '__sku_alias__webpackStats',
            'virtual:sku/polyfills',
            'virtual:sku/entry-side-effects',
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
    files: ['tests/**', 'test-utils/**'],
    languageOptions: {
      globals: {
        browser: true,
      },
    },
    rules: {
      // `toMatchExitCode` is frequently asserted from `beforeAll`/`beforeEach` hooks when testing `sku start` functionality.
      'vitest/no-standalone-expect': 'off',
    },
  },
  {
    plugins: {
      markdown: plugin,
    },
  },
  {
    files: ['site/docs/**/*.md'],
    processor: 'markdown/markdown',
  },
  {
    files: ['site/docs/**/*.md/**'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { impliedStrict: true },
        project: false,
        projectService: false,
      },
    },
    rules: {
      'eol-last': 'off',
      'no-undef': 'off',
      'no-unused-expressions': 'off',
      'no-unused-vars': 'off',
      'padded-blocks': 'off',
      strict: 'off',
      'unicode-bom': 'off',
      'import-x/no-unresolved': 'off',
      'import-x/no-extraneous-dependencies': 'off',
      'n/prefer-node-protocol': 'off',
      'no-console': 'off',
      'arrow-body-style': 'off',
      'new-cap': 'off',
      'no-labels': 'off',
      'no-self-compare': 'off',
      'react/jsx-no-undef': 'off',
      'react/no-unknown-property': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      // sku enables type-aware rules; snippets have no tsconfig.
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },
];
