import { readFile, writeFile } from 'node:fs/promises';

import { getPathFromCwd } from '@sku-private/utils';
import { applyEdits, modify } from 'jsonc-parser';

import { hasErrorMessage } from './error-guards.js';

const formattingOptions = { insertSpaces: true, tabSize: 2 };

/**
 * Sync the `imports` field of the project's `package.json` with the `pathAliases`
 * sku config option.
 *
 * sku takes complete ownership of the `imports` field: it is fully replaced with
 * the entries derived from `pathAliases`. When `pathAliases` is empty or omitted,
 * the `imports` field is removed entirely.
 *
 * Edits are applied surgically via `jsonc-parser` so the rest of `package.json`
 * (key order, formatting, comments) is preserved, and the file is only written
 * when its contents actually change. This keeps the operation idempotent, as it
 * runs on every sku command.
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
    return;
  }

  const hasAliases = Object.keys(pathAliases).length > 0;
  const value = hasAliases ? pathAliases : undefined;

  const edits = modify(source, ['imports'], value, { formattingOptions });
  const updated = applyEdits(source, edits);

  if (updated === source) {
    return;
  }

  try {
    await writeFile(packageJsonPath, updated);
  } catch (error) {
    const message = hasErrorMessage(error) ? `: ${error.message}` : '';
    throw new Error(
      `Failed to update the "imports" field in package.json${message}`,
    );
  }
};
