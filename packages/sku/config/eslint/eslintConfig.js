const { eslintDecorator } = require('../../context');
const importOrderConfig = require('./importOrderConfig');
const coreConfig = require('eslint-config-seek');

const baseConfig = [
  {
    ignores: [
      '**/*.vocab/index.ts',
      '.eslintcache',
      '.eslintrc',
      '.prettierrc',
      'coverage/',
      'dist/',
      'pnpm-lock.yaml',
      'report/',
      'tsconfig.json',
    ],
  },
  importOrderConfig,
  ...coreConfig,
];

module.exports = eslintDecorator(baseConfig);
