const { eslintDecorator } = require('../../context');
const baseConfig = {
  extends: require.resolve('eslint-config-seek'),
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:@typescript-eslint/recommended'],
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      rules: {
        'no-empty-function': 'error',
      },
      globals: {
        ENV: 'off',
      },
    },
  ],
};

module.exports = eslintDecorator(baseConfig);
