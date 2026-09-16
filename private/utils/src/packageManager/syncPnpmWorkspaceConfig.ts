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
import type {
  CheckContext,
  RecordMutation,
  SyncContext,
} from './syncShared.ts';
import {
  checkSingleValueSettings,
  syncSingleValueSettings,
} from './syncSingleValueSettings.ts';

export interface CheckPnpmWorkspaceConfigOptions {
  targetDir?: string;
}

export interface PnpmWorkspaceCheckResult {
  hasFailure: boolean;
  failures: string[];
  advisories: string[];
}

const assertValidWorkspaceDocument = (doc: Document): void => {
  if (doc.errors.length > 0) {
    throw new Error(
      `pnpm-workspace.yaml is invalid: ${doc.errors.map((error) => error.message).join('; ')}`,
    );
  }

  if (!doc.contents) {
    doc.contents = doc.createNode({});
    return;
  }

  if (!isMap(doc.contents)) {
    throw new Error(`pnpm-workspace.yaml must contain a YAML mapping`);
  }
};

export async function checkPnpmWorkspaceConfig({
  targetDir = process.cwd(),
}: CheckPnpmWorkspaceConfigOptions = {}): Promise<PnpmWorkspaceCheckResult> {
  const filePath = join(targetDir, 'pnpm-workspace.yaml');
  if (!existsSync(filePath)) {
    return { hasFailure: false, failures: [], advisories: [] };
  }

  const content = await readFile(filePath, 'utf-8');
  const doc: Document = parseDocument(content);
  assertValidWorkspaceDocument(doc);

  const checkContext: CheckContext = {
    doc,
    failures: [],
    advisories: [],
  };

  checkPnpmPluginSku(checkContext);
  checkSingleValueSettings(checkContext);
  checkObjectSettings(checkContext);
  checkArraySettings(checkContext);

  return {
    hasFailure: checkContext.failures.length > 0,
    failures: checkContext.failures,
    advisories: checkContext.advisories,
  };
}

export interface SyncPnpmWorkspaceConfigOptions {
  targetDir?: string;
  create?: boolean;
}

export async function syncPnpmWorkspaceConfig({
  create = false,
  targetDir = process.cwd(),
}: SyncPnpmWorkspaceConfigOptions = {}): Promise<void> {
  const filePath = join(targetDir, 'pnpm-workspace.yaml');
  const fileExisted = existsSync(filePath);

  if (!fileExisted && !create) {
    return;
  }

  let originalContent = '';
  let doc: Document;

  if (fileExisted) {
    originalContent = await readFile(filePath, 'utf-8');
    doc = parseDocument(originalContent);
    assertValidWorkspaceDocument(doc);
  } else {
    doc = new Document(structuredClone(defaultPnpmWorkspaceConfig));
  }

  let modified = false;

  const recordMutation: RecordMutation = (message) => {
    modified = true;
    console.log(message);
  };

  if (!fileExisted) {
    recordMutation('created pnpm-workspace.yaml');
  }

  const context: SyncContext = { doc, recordMutation };

  removePnpmPluginSku(context);
  syncSingleValueSettings(context);
  syncObjectSettings(context);
  syncArraySettings(context);

  if (modified) {
    const newContent = doc.toString();
    if (newContent !== originalContent) {
      await writeFile(filePath, newContent, 'utf-8');
    }
  }
}
