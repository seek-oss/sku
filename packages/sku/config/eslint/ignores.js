const { languages } = require('../../context');

const ignores = {
  ignores: [
    ...(languages ? ['**/*.vocab/index.ts'] : []),
    '**/.eslintcache',
    '**/eslint.config.js',
    '**/.prettierrc',
    '**/coverage/',
    '**/dist/',
    '**/report/',
    '**/tsconfig.json',
    '**/pnpm-lock.yaml',
  ],
};

module.exports = {
  ignores,
};
