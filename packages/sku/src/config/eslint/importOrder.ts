import type { Linter } from 'eslint';

export const createImportOrderConfig = (): Linter.Config => ({
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
