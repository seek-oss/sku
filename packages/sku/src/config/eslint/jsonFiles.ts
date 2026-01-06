// @ts-expect-error - no types available
import jsonFilesPlugin from 'eslint-plugin-json-files';
import type { Linter } from 'eslint';

export const createJsonFilesConfig = (): Linter.Config => ({
  plugins: {
    'json-files': jsonFilesPlugin,
  },
  processor: 'json-files/json',
  files: ['**/package.json'],
  rules: {
    'json-files/sort-package-json': 'warn',
  },
});
