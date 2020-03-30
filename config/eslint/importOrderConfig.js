const path = require('path');
const { paths } = require('../../context');

const internalRegex = `^(${paths.src
  .map((srcPath) => path.basename(srcPath))
  .join('|')})/`;

module.exports = {
  settings: {
    'import/internal-regex': internalRegex,
  },
  rules: {
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
        groups: [
          'builtin',
          'external',
          'parent',
          'internal',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: '*.+(treat|less)',
            group: 'index',
            position: 'after',
            patternOptions: { matchBase: true },
          },
        ],
      },
    ],
  },
};
