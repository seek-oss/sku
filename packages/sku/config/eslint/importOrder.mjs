import { basename } from 'node:path';
import { paths, rootResolution } from '../../context';

const internalRegex = `^(${paths.src
  .map((srcPath) => basename(srcPath))
  .join('|')})/`;

const rootResolutionConfig = {
  settings: {
    'import-x/internal-regex': internalRegex,
  },
};

export const importOrderConfig = {
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
