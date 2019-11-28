const ts = {
  files: ['**/*.ts', '**/*.tsx'],
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-empty-function': 'error',
    'react/jsx-filename-extension': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
  globals: {
    ENV: 'off',
  },
};

// const working = {
//   env: { browser: true, es6: true, node: true },
//   extends: ['eslint:recommended', 'plugin:react/recommended'],
//   globals: { Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
//   parser: 'babel-eslint',
//   parserOptions: {
//     ecmaFeatures: { jsx: true },
//     ecmaVersion: 2018,
//     sourceType: 'module',
//   },
//   plugins: ['react'],
//   rules: {
//     indent: ['error', 2, { SwitchCase: 1 }],
//     'linebreak-style': ['error', 'unix'],
//     quotes: ['error', 'single'],
//     'comma-dangle': ['error', 'always-multiline'],
//     semi: ['error', 'always'],
//   },
//   settings: { react: { version: 'detect' } },
//   overrides: [
//     {
//       files: ['**/*.ts', '**/*.tsx'],
//       env: { browser: true, es6: true, node: true },
//       extends: [
//         'eslint:recommended',
//         'plugin:react/recommended',
//         'plugin:@typescript-eslint/eslint-recommended',
//         'plugin:@typescript-eslint/recommended',
//       ],
//       globals: { Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
//       parser: '@typescript-eslint/parser',
//       parserOptions: {
//         ecmaFeatures: { jsx: true },
//         ecmaVersion: 2018,
//         sourceType: 'module',
//         project: './tsconfig.json',
//       },
//       plugins: ['react', '@typescript-eslint'],
//       rules: {
//         indent: ['error', 2, { SwitchCase: 1 }],
//         'linebreak-style': ['error', 'unix'],
//         quotes: ['error', 'single'],
//         'comma-dangle': ['error', 'always-multiline'],
//         '@typescript-eslint/no-explicit-any': 0,
//       },
//       settings: { react: { version: 'detect' } },
//     },
//   ],
// };

const { eslintDecorator } = require('../../context');

const baseConfig = {
  extends: require.resolve('eslint-config-seek'),
  overrides: [ts], // working.overrides,
};

module.exports = eslintDecorator(baseConfig);
