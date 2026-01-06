// @ts-expect-error
import jsonFilesPlugin from 'eslint-plugin-json-files';
import type { SkuContext } from '../../context/createSkuContext.js';
import type { Linter } from 'eslint';

export const createJsonFilesConfig = (_: SkuContext): Linter.Config => ({
  plugins: {
    'json-files': jsonFilesPlugin,
  },
  processor: 'json-files/json',
  files: ['**/package.json'],
  rules: {
    'json-files/sort-package-json': 'warn',
  },
});
