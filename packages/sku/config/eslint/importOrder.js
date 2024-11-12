const path = require('node:path');
const { paths, rootResolution } = require('../../context');

const internalRegex = `^(${paths.src
  .map((srcPath) => path.basename(srcPath))
  .join('|')})/`;

const rootResolutionConfig = {
  settings: {
    'import-x/internal-regex': internalRegex,
  },
};

const importOrderConfig = {
  ...(rootResolution ? rootResolutionConfig : undefined),
  rules: {
    'import-x/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: '*.css',
            group: 'index',
            position: 'after',
            patternOptions: { matchBase: true },
          },
        ],
      },
    ],
  },
};

module.exports = { importOrderConfig };
