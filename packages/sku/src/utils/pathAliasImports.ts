import { readFile, writeFile } from 'node:fs/promises';

import { getPathFromCwd } from '@sku-private/utils';

import { hasErrorMessage } from './error-guards.js';
import _debug from 'debug';

const debug = _debug('sku:path-alias-imports');

/**
 * Syncs the user's `package.json#imports` field with sku's `sku.config.ts#pathAliases` option.
 */
export const syncPathAliasImports = async (
  pathAliases: Record<string, string> = {},
) => {
  const packageJsonPath = getPathFromCwd('package.json');

  let source: string;
  try {
    source = await readFile(packageJsonPath, 'utf-8');
  } catch {
    // No `package.json` in the current working directory (e.g. during `sku init`).
    debug('No package.json found, skipping path alias imports');
    return;
  }

  const hasAliases = Object.keys(pathAliases).length > 0;

  const packageJson = JSON.parse(source);
  if (hasAliases) {
    packageJson.imports = pathAliases;
  } else {
    delete packageJson.imports;
  }

  const updated = `${JSON.stringify(packageJson, null, 2)}\n`;

  if (updated === source) {
    debug('package.json is already in sync, skipping update');
    return;
  }

  try {
    await writeFile(packageJsonPath, updated);
    debug('Updated package.json with path alias imports');
  } catch (error) {
    const message = hasErrorMessage(error) ? `: ${error.message}` : '';
    throw new Error(
      `Failed to update the "imports" field in package.json${message}`,
    );
  }
};
