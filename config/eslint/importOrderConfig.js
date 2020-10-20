const path = require('path');
const { paths, isCompilePackage } = require('../../context');

const internalRegex = `^(${paths.src
  .map((srcPath) => path.basename(srcPath))
  .join('|')})/`;

const rootResolutionConfig = {
  settings: {
    'import/internal-regex': internalRegex,
  },
};

module.exports = {
  ...(!isCompilePackage ? rootResolutionConfig : undefined),
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
