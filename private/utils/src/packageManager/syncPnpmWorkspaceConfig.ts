import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Document, isMap, parseDocument } from 'yaml';
import {
  checkPnpmPluginSku,
  removePnpmPluginSku,
} from './removePnpmPluginSku.ts';
import { defaultPnpmWorkspaceConfig } from './pnpmWorkspaceDefaults.ts';
import { checkArraySettings, syncArraySettings } from './syncArraySettings.ts';
import {
  checkObjectSettings,
  syncObjectSettings,
} from './syncObjectSettings.ts';
import {
  pnpmWorkspaceFileName,
  type CheckContext,
  type RecordMutation,
  type SyncContext,
} from './syncShared.ts';

export { pnpmWorkspaceFileName } from './syncShared.ts';
import {
  checkSingleValueSettings,
  syncSingleValueSettings,
} from './syncSingleValueSettings.ts';

export interface PnpmWorkspaceCheckResult {
  failures: string[];
  advisories: string[];
}

const parseWorkspaceDocument = (content: string): Document => {
  // Widened from `Document.Parsed` so an empty document's contents can be set.
  const doc: Document = parseDocument(content);

  if (doc.errors.length > 0) {
    const reasons = doc.errors.map(({ message }) => message).join('; ');
    throw new Error(`${pnpmWorkspaceFileName} is invalid: ${reasons}`);
  }

  if (!doc.contents) {
    doc.contents = doc.createNode({});
  } else if (!isMap(doc.contents)) {
    throw new Error(`${pnpmWorkspaceFileName} must contain a YAML mapping`);
  }

  return doc;
};

export async function checkPnpmWorkspaceConfig({
  targetDir = process.cwd(),
}: { targetDir?: string } = {}): Promise<PnpmWorkspaceCheckResult> {
  const filePath = join(targetDir, pnpmWorkspaceFileName);
  if (!existsSync(filePath)) {
    return { failures: [], advisories: [] };
  }

  const context: CheckContext = {
    doc: parseWorkspaceDocument(await readFile(filePath, 'utf-8')),
    failures: [],
    advisories: [],
  };

  checkPnpmPluginSku(context);
  checkSingleValueSettings(context);
  checkObjectSettings(context);
  checkArraySettings(context);

  return { failures: context.failures, advisories: context.advisories };
}

export interface SyncPnpmWorkspaceConfigOptions {
  targetDir?: string;
  create?: boolean;
}

export async function syncPnpmWorkspaceConfig({
  create = false,
  targetDir = process.cwd(),
}: SyncPnpmWorkspaceConfigOptions = {}): Promise<void> {
  const filePath = join(targetDir, pnpmWorkspaceFileName);
  const fileExisted = existsSync(filePath);

  if (!fileExisted && !create) {
    return;
  }

  const originalContent = fileExisted ? await readFile(filePath, 'utf-8') : '';
  const doc = fileExisted
    ? parseWorkspaceDocument(originalContent)
    : new Document(structuredClone(defaultPnpmWorkspaceConfig));

  let modified = !fileExisted;
  const recordMutation: RecordMutation = (message) => {
    modified = true;
    // A file written from the defaults needs no narration: the sync passes below
    // only attach ownership markers, so `created ...` already says everything.
    if (fileExisted) {
      console.log(message);
    }
  };

  if (!fileExisted) {
    console.log(`created ${pnpmWorkspaceFileName}`);
  }

  const context: SyncContext = { doc, recordMutation };

  removePnpmPluginSku(context);
  syncSingleValueSettings(context);
  syncObjectSettings(context);
  syncArraySettings(context);

  // Serialise only after a real mutation: a round-trip through `yaml` can
  // reformat an untouched document, which would rewrite the user's file.
  if (modified) {
    const newContent = doc.toString();
    if (newContent !== originalContent) {
      await writeFile(filePath, newContent, 'utf-8');
    }
  }
}
