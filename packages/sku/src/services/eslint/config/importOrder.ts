import { basename } from 'node:path';
import { SkuContext } from '@/context/createSkuContext.js';

const internalRegex = (paths: SkuContext['paths']) =>
  `^(${paths.src.map((srcPath: string) => basename(srcPath)).join('|')})/`;

const rootResolutionConfig = (paths: SkuContext['paths']) => ({
  settings: {
    'import-x/internal-regex': internalRegex(paths),
  },
});

export const createImportOrderConfig = ({
  paths,
  rootResolution,
}: SkuContext) => ({
  ...(rootResolution ? rootResolutionConfig(paths) : undefined),
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
});
