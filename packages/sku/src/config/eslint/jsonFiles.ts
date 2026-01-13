import type { Linter } from 'eslint';
import { packageJsonPlugin, jsonProcessor } from './rules/sort-package-json.js';

export const createJsonFilesConfig = (): Linter.Config[] => [
  {
    plugins: {
      'package-json': packageJsonPlugin,
    },
    // Lint all package.json files, including nested ones in monorepos if running lint from workspace root
    files: ['**/package.json'],
    rules: {
      'package-json/sort': 'warn',
    },
    processor: jsonProcessor,
  },
];
