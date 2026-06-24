import { basename } from 'node:path';
import type { SkuContext } from '../../context/createSkuContext.js';
import type { Linter } from 'eslint';

// Matches both legacy root-resolution imports (e.g. `src/foo`) and native
// subpath imports (e.g. `#src/foo`) so they are grouped as internal imports.
const internalRegex = (paths: SkuContext['paths']) =>
  `^#?(${paths.src.map((srcPath: string) => basename(srcPath)).join('|')})/`;

export const createImportOrderConfig = ({
  paths,
}: SkuContext): Linter.Config => ({
  settings: {
    'import-x/internal-regex': internalRegex(paths),
  },
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
