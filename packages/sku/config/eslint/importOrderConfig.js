const path = require('path');
const { paths, rootResolution } = require('../../context');

const internalRegex = `^(${paths.src
  .map((srcPath) => path.basename(srcPath))
  .join('|')})/`;

const rootResolutionConfig = {
  settings: {
    'import/internal-regex': internalRegex,
  },
};

module.exports = {
  ...(rootResolution ? rootResolutionConfig : undefined),
  rules: {
    'import/order': [
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
            pattern: '*.+(less|css)',
            group: 'index',
            position: 'after',
            patternOptions: { matchBase: true },
          },
        ],
      },
    ],
  },
};
