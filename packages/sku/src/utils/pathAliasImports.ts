import { readFile, writeFile } from 'node:fs/promises';

import { getPathFromCwd } from '@sku-private/utils';

import { hasErrorMessage } from './error-guards.js';
import type { LintResult } from './runLintChecks.js';
import { suggestScript } from './suggestScript.js';
import { createDebug } from 'obug';
import { accentLight, secondary } from '@sku-private/utils/console';

const debug = createDebug('sku:path-alias-imports');

type PathAliases = Record<string, string>;

interface SyncedPackageJson {
  packageJsonPath: string;
  synced: string;
  isAlreadyInSync: boolean;
}

const makeSyncedPackageJson = async (
  pathAliases: PathAliases,
): Promise<SyncedPackageJson | undefined> => {
  const packageJsonPath = getPathFromCwd('package.json');

  let source: string;
  try {
    source = await readFile(packageJsonPath, 'utf-8');
  } catch {
    debug('No package.json found, skipping path alias imports');
    return undefined;
  }

  const packageJson = JSON.parse(source);
  if (Object.keys(pathAliases).length > 0) {
    packageJson.imports = pathAliases;
  } else {
    delete packageJson.imports;
  }

  const synced = `${JSON.stringify(packageJson, null, 2)}\n`;

  return {
    packageJsonPath,
    synced,
    isAlreadyInSync: synced === source,
  };
};

const outOfSyncMessage =
  'package.json#imports is out of sync with the `pathAliases` sku config option.';

export const syncPathAliasImports = async (
  pathAliases: PathAliases = {},
): Promise<LintResult> => {
  console.log(accentLight(`Syncing package.json with path aliases`));
  const result = await makeSyncedPackageJson(pathAliases);
  if (!result) {
    return { exitCode: 0 };
  }

  if (result.isAlreadyInSync) {
    console.log(secondary('package.json is already in sync, skipping update'));
    return { exitCode: 0 };
  }

  try {
    await writeFile(result.packageJsonPath, result.synced);
    console.log(secondary('Updated package.json with path alias imports'));
  } catch (error) {
    const message = hasErrorMessage(error) ? `: ${error.message}` : '';
    console.error(
      `Failed to update the "imports" field in package.json${message}`,
    );
    return { exitCode: 1 };
  }

  return { exitCode: 0 };
};

export const checkPathAliasImports = async (
  pathAliases: PathAliases = {},
): Promise<LintResult> => {
  console.log(accentLight(`Checking package.json for path alias imports`));
  const result = await makeSyncedPackageJson(pathAliases);
  if (!result || result.isAlreadyInSync) {
    return { exitCode: 0 };
  }

  console.error(outOfSyncMessage);
  suggestScript('format');
  return { exitCode: 1 };
};

export const assertPathAliasImports = async (pathAliases: PathAliases = {}) => {
  const result = await makeSyncedPackageJson(pathAliases);
  if (!result || result.isAlreadyInSync) {
    return;
  }

  console.error(outOfSyncMessage);
  suggestScript('format');
  process.exit(1);
};
