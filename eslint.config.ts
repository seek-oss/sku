import seek from 'eslint-config-seek';
import jsdoc from 'eslint-plugin-jsdoc';
import nodePlugin from 'eslint-plugin-n';
import vitest from '@vitest/eslint-plugin';

const modifiedSeek = seek.map((config) => {
  // Removing the jest plugin and rules so they don't conflict with the vitest plugin
  if (config.plugins?.jest) {
    delete config.plugins.jest;
  }

  if (config.rules) {
    for (const ruleName of Object.keys(config.rules)) {
      if (ruleName.includes('jest')) {
        config.rules[ruleName] = 'off';
      }
    }
  }

  return config;
});

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
  ...modifiedSeek,
  {
    plugins: {
      jsdoc,
      n: nodePlugin,
      vitest,
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
      ...vitest.configs.recommended.rules,
      'vitest/no-focused-tests': 'error',
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
