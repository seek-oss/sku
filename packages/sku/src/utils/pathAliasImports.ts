import { readFile, writeFile } from 'node:fs/promises';

import { getPathFromCwd } from '@sku-private/utils';
import { applyEdits, modify } from 'jsonc-parser';

import { hasErrorMessage } from './error-guards.js';
import _debug from 'debug';

const formattingOptions = { insertSpaces: true, tabSize: 2 };

const debug = _debug('sku:path-alias-imports');

/**
 * Sync the `imports` field of the project's `package.json` with the `pathAliases`
 * sku config option.
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
  const value = hasAliases ? pathAliases : undefined;

  const edits = modify(source, ['imports'], value, { formattingOptions });
  const updated = applyEdits(source, edits);

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

/**
 * Alternate implementation of {@link syncPathAliasImports} that uses
 * `JSON.parse`/`JSON.stringify` instead of `jsonc-parser`.
 *
 * Note: unlike the `jsonc-parser` version, this re-serialises the entire file,
 * so it does not preserve the original formatting, comments, or key ordering.
 */
export const syncPathAliasImportsJson = async (
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
